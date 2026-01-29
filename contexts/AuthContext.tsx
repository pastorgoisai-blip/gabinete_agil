
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

// Tipo para o Perfil do Usuário (extensão da tabela profiles)
export interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: 'super_admin' | 'admin' | 'manager' | 'staff' | 'volunteer';
    cabinet_id: string | null;
    avatar_url?: string;
    status?: 'active' | 'inactive' | 'pending';

    is_super_admin?: boolean; // Coluna DB: is_super_admin
    permissions?: Record<string, { view: boolean; edit: boolean; delete: boolean }>;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    recoveryMode: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [recoveryMode, setRecoveryMode] = useState(false);

    useEffect(() => {
        const initializeAuth = async () => {
            // --- SECURITY CHECK: PASSWORD RECOVERY FLOW ---
            // Verifica se a URL contém tokens de recuperação ANTES de verificar a sessão existente
            // Isso evita que o Supabase restaure a sessão antiga (IDOR/Fixation) antes de processarmos o reset
            const hash = window.location.hash;

            // FIX: HashRouter Mismatch + Auth Token Loss
            // Problem: Supabase redirects to /reset-password#tokens... but HashRouter expects /#/reset-password.
            // Rewriting the URL often drops tokens or confuses the router.
            // Solution: Manually capture tokens from the "Phantom" URL, hydrate the Supabase session, 
            // and THEN redirect to the clean HashRouter path.
            if (window.location.pathname === '/reset-password') {
                console.log('Detected Phantom Route. Attempting manual session hydration...');

                // Remove the leading '#' from the hash
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');

                console.log('[AuthContext Debug] Hash:', window.location.hash);
                console.log('[AuthContext Debug] AccessToken Found:', !!accessToken);
                console.log('[AuthContext Debug] RefreshToken Found:', !!refreshToken);

                if (accessToken && refreshToken) {
                    // Manually set session. This persists to LocalStorage naturally.
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });

                    if (error) {
                        console.error('Error hydrating recovery session:', error);
                        // Fallback: Pass tokens via state so ResetPassword can try again
                        window.history.replaceState({ accessToken, refreshToken }, '', window.location.origin + '/#/reset-password');
                        window.dispatchEvent(new Event('hashchange'));
                        return;
                    }

                    console.log('Session hydrated. Performing Soft Redirect to HashRouter path.');
                    // Pass tokens in state just in case session is lost during transition
                    window.history.replaceState({ accessToken, refreshToken }, '', window.location.origin + '/#/reset-password');
                    // Force React Router to detect change
                    window.dispatchEvent(new Event('hashchange'));
                    window.dispatchEvent(new Event('popstate'));
                    return;
                } else {
                    console.warn('Phantom Route but no tokens. Redirecting...');
                    window.history.replaceState(null, '', window.location.origin + '/#/reset-password');
                    window.dispatchEvent(new Event('hashchange'));
                    return;
                }
            }

            // Check for Supabase recovery tokens (type=recovery OR access_token present in specific reset scenarios)
            // Supabase redirects to /#access_token=...&refresh_token=...&type=recovery
            const isRecovery = hash.includes('type=recovery') ||
                (hash.includes('access_token=') && hash.includes('refresh_token=') && !hash.includes('/invite/'));

            if (isRecovery) {
                const { data: { session: existingSession } } = await supabase.auth.getSession();

                // 1. STALE SESSION CHECK (Security Fix for IDOR/Session Fixation)
                // If there is ANY existing session during a recovery attempt, we must clear it strictly.
                // Supabase might have restored the previous user from LocalStorage.
                if (existingSession) {
                    console.warn('[Security] Stale session detected during recovery. NUKING LocalStorage and Reloading.');

                    // Backup SignOut
                    await supabase.auth.signOut();

                    // CRITICAL: Manually clear Supabase tokens from LocalStorage
                    // This prevents Supabase Client from picking up the old session on reload
                    Object.keys(localStorage).forEach(key => {
                        if (key.startsWith('sb-')) {
                            localStorage.removeItem(key);
                        }
                    });

                    window.location.reload();
                    return; // Stop execution, browser will reload
                }

                // If no session exists, we proceed. The tokens in URL will be consumed by Supabase client
                // which will eventually fire PASSWORD_RECOVERY or SIGNED_IN event.
            }

            // --- NORMAL FLOW ---
            // Verificar sessão atual (apenas se não for recuperação)
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }

            // Escutar mudanças na sessão
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                // Ignore SIGNED_IN if we are in the middle of a forced recovery logout flow? 
                // Difficult to track. But generally safe.

                if (event === 'PASSWORD_RECOVERY') {
                    setRecoveryMode(true);
                    setLoading(false);
                    // DO NOT return, let session be set if present
                }

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                    setLoading(false);
                }
            });

            return () => subscription.unsubscribe();
        };

        initializeAuth();
    }, []);

    // Real-time subscription for Profile Updates
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`profile-updates-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`,
                },
                (payload) => {
                    const newProfile = payload.new as UserProfile;
                    setProfile(newProfile);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // --- SECURITY: Detect Password Recovery Flow ---
    // (Integrado no useEffect principal para evitar Race Conditions)

    async function fetchProfile(userId: string) {
        try {
            // SECURITY: Evitar IDOR.
            // Se já temos um user na sessão, garantir que estamos buscando o perfil DELE.
            const currentUser = (await supabase.auth.getUser()).data.user;

            if (currentUser && currentUser.id !== userId) {
                console.error('ALERTA DE SEGURANÇA: Tentativa de carregar perfil diferente do usuário autenticado.');
                // Força o ID correto ou aborta
                userId = currentUser.id;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Erro ao buscar perfil:', error);
            } else {
                setProfile(data);

                // --- Lockdown de Segurança (Refactor Critic) ---
                // Se o usuário está logado mas NÃO tem gabinete, deve ir para Pending Invite ou Join
                if (data && !data.cabinet_id) {
                    const currentHash = window.location.hash.replace('#', '');
                    const allowedRoutes = ['/onboarding', '/pending-invite', '/login', '/invite']; // Added /invite

                    // Se for fluxo de invite ou recovery, não redirecionar
                    if (!allowedRoutes.some(route => currentHash.startsWith(route)) && !currentHash.includes('type=recovery')) {
                        console.warn('Usuário sem gabinete. Redirecionando para Invite Pendente.');
                        window.location.hash = '#/pending-invite';
                    }
                }
            }
        } catch (err) {
            console.error('Erro inesperado ao buscar perfil:', err);
        } finally {
            setLoading(false);
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, recoveryMode, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
