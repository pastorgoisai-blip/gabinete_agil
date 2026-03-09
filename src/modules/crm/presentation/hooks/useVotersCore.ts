import { useState, useCallback } from 'react';
import type { Voter } from '../../domain/entities/Voter';
import type { VoterFilters } from '../../domain/repositories/IVoterRepository';
import type { CreateVoterInput } from '../../use_cases/CreateVoterUseCase';
import { SupabaseVoterRepository } from '../../infrastructure/repositories/SupabaseVoterRepository';
import { ListVotersByCabinetUseCase } from '../../use_cases/ListVotersByCabinetUseCase';
import { CreateVoterUseCase } from '../../use_cases/CreateVoterUseCase';
import { RepositoryError } from '../../../shared/infrastructure/RepositoryError';

interface UseVotersCoreReturn {
  voters: Voter[];
  isLoading: boolean;
  error: string | null;
  fetchVoters: (cabinetId: string, filters?: VoterFilters) => Promise<void>;
  createVoter: (cabinetId: string, input: CreateVoterInput) => Promise<{ success: boolean; error?: string }>;
  updateVoter: (id: string, updates: Partial<Voter>) => Promise<{ success: boolean; error?: string }>;
  deleteVoter: (id: string) => Promise<{ success: boolean; error?: string }>;
}

function formatError(err: unknown): string {
  if (err instanceof RepositoryError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Erro desconhecido.';
}

export function useVotersCore(): UseVotersCoreReturn {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const repo = new SupabaseVoterRepository();

  const fetchVoters = useCallback(async (cabinetId: string, filters?: VoterFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const useCase = new ListVotersByCabinetUseCase(repo);
      const result = await useCase.execute(cabinetId, filters);
      setVoters(result);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createVoter = useCallback(async (cabinetId: string, input: CreateVoterInput) => {
    setError(null);
    try {
      const useCase = new CreateVoterUseCase(repo);
      const newVoter = await useCase.execute(cabinetId, input);
      setVoters(prev => [newVoter, ...prev]);
      return { success: true };
    } catch (err) {
      const message = formatError(err);
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const updateVoter = useCallback(async (id: string, updates: Partial<Voter>) => {
    setError(null);
    try {
      const updated = await repo.update(id, updates);
      setVoters(prev => prev.map(v => (v.id === id ? updated : v)));
      return { success: true };
    } catch (err) {
      const message = formatError(err);
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const deleteVoter = useCallback(async (id: string) => {
    setError(null);
    try {
      await repo.delete(id);
      setVoters(prev => prev.filter(v => v.id !== id));
      return { success: true };
    } catch (err) {
      const message = formatError(err);
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  return { voters, isLoading, error, fetchVoters, createVoter, updateVoter, deleteVoter };
}
