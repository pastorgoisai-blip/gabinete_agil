import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatCard from './StatCard';
// Mock de ícone para o teste
const MockIcon = () => <svg data-testid="mock-icon" />;

describe('StatCard', () => {
    it('deve renderizar título e valor corretamente', () => {
        render(
            <StatCard
                title="Total Eleitores"
                value="1.234"
                icon={MockIcon}
                colorClass="bg-blue-500"
            />
        );

        expect(screen.getByText('Total Eleitores')).toBeInTheDocument();
        expect(screen.getByText('1.234')).toBeInTheDocument();
    });

    it('deve renderizar o subtexto quando fornecido', () => {
        render(
            <StatCard
                title="Teste"
                value="100"
                subtext="Crescimento de 10%"
                icon={MockIcon}
                colorClass="bg-blue-500"
            />
        );

        expect(screen.getByText('Crescimento de 10%')).toBeInTheDocument();
    });

    it('deve renderizar a tendência quando fornecida', () => {
        render(
            <StatCard
                title="Teste"
                value="100"
                trend="5%"
                icon={MockIcon}
                colorClass="bg-blue-500"
            />
        );

        expect(screen.getByText('5%')).toBeInTheDocument();
    });
});
