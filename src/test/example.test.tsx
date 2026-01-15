import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('Smoke Test', () => {
    it('should be able to render a simple element', () => {
        render(<div data-testid="test-div">Hello TDD</div>);
        const element = screen.getByTestId('test-div');
        expect(element).toBeInTheDocument();
        expect(element).toHaveTextContent('Hello TDD');
    });
});
