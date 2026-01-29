import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import React from 'react';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
            signOut: vi.fn(),
            getUser: vi.fn(),
        },
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn(),
        })),
        removeChannel: vi.fn(),
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(),
        })),
    },
}));

// Helper component to consume context
const TestComponent = () => {
    const { session, user } = useAuth();
    return (
        <div>
            <div data-testid="session-user">{user ? user.id : 'no-user'}</div>
        </div>
    );
};

describe('AuthContext Security - IDOR Prevention', () => {
    const originalLocation = window.location;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock window.location.reload
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { ...originalLocation, hash: '', reload: vi.fn(), replace: vi.fn() },
        });
    });

    afterAll(() => {
        Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    });

    it('should force signOut and reload if recovery token is present while logged in', async () => {
        // 1. Arrange: User is logged in
        const mockSession = { user: { id: 'user-123', email: 'victim@test.com' } };
        (supabase.auth.getSession as any).mockResolvedValue({ data: { session: mockSession } });
        (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockSession.user } });

        // 2. Arrange: URL has recovery token
        window.location.hash = '#access_token=token123&type=recovery';

        // 3. Act: Render AuthProvider
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        // 4. Assert: Should call signOut and reload
        await waitFor(() => {
            expect(supabase.auth.signOut).toHaveBeenCalled();
            expect(window.location.reload).toHaveBeenCalled();
        });
    });

    it('should NOT signOut if recovery token is present but NO session exists', async () => {
        // 1. Arrange: No user logged in
        (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });

        // 2. Arrange: URL has recovery token
        window.location.hash = '#access_token=token123&type=recovery';

        // 3. Act
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        // 4. Assert
        await waitFor(() => {
            expect(supabase.auth.signOut).not.toHaveBeenCalled();
            expect(window.location.reload).not.toHaveBeenCalled();
        });
    });
});
