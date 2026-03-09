import { useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import type { Demand, DemandStatusValue } from '../../domain/entities/Demand';
import type { DemandFilters } from '../../domain/repositories/IDemandRepository';
import type { CreateDemandInput } from '../../use_cases/CreateDemandUseCase';
import { SupabaseDemandRepository } from '../../infrastructure/repositories/SupabaseDemandRepository';
import { CreateDemandUseCase } from '../../use_cases/CreateDemandUseCase';
import { UpdateDemandStatusUseCase } from '../../use_cases/UpdateDemandStatusUseCase';
import { RepositoryError } from '../../../shared/infrastructure/RepositoryError';

interface UseDemandsCoreReturn {
  demands: Demand[];
  isLoading: boolean;
  error: string | null;
  fetchDemands: (cabinetId: string, filters?: DemandFilters) => Promise<void>;
  createDemand: (cabinetId: string, input: CreateDemandInput) => Promise<{ success: boolean; error?: string }>;
  updateDemandStatus: (demandId: string, newStatus: DemandStatusValue) => Promise<{ success: boolean; error?: string }>;
  updateDemand: (id: string, updates: Partial<Demand>) => Promise<{ success: boolean; error?: string }>;
  deleteDemand: (id: string) => Promise<{ success: boolean; error?: string }>;
  getCategories: (cabinetId: string) => Promise<string[]>;
  setDemands: Dispatch<SetStateAction<Demand[]>>;
}

function formatError(err: unknown): string {
  if (err instanceof RepositoryError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Erro desconhecido.';
}

export function useDemandsCore(): UseDemandsCoreReturn {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const repo = new SupabaseDemandRepository();

  const fetchDemands = useCallback(async (cabinetId: string, filters?: DemandFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await repo.findByCabinetId(cabinetId, filters);
      setDemands(result);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDemand = useCallback(async (cabinetId: string, input: CreateDemandInput) => {
    setError(null);
    try {
      const useCase = new CreateDemandUseCase(repo);
      const newDemand = await useCase.execute(cabinetId, input);
      setDemands(prev => [newDemand, ...prev]);
      return { success: true };
    } catch (err) {
      const message = formatError(err);
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const updateDemandStatus = useCallback(async (demandId: string, newStatus: DemandStatusValue) => {
    setError(null);
    try {
      const useCase = new UpdateDemandStatusUseCase(repo);
      const updated = await useCase.execute({ demandId, newStatus });
      setDemands(prev => prev.map(d => (d.id === updated.id ? updated : d)));
      return { success: true };
    } catch (err) {
      const message = formatError(err);
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const updateDemand = useCallback(async (id: string, updates: Partial<Demand>) => {
    setError(null);
    try {
      const updated = await repo.update(id, updates);
      setDemands(prev => prev.map(d => (d.id === id ? updated : d)));
      return { success: true };
    } catch (err) {
      const message = formatError(err);
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const deleteDemand = useCallback(async (id: string) => {
    setError(null);
    try {
      await repo.delete(id);
      setDemands(prev => prev.filter(d => d.id !== id));
      return { success: true };
    } catch (err) {
      const message = formatError(err);
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const getCategories = useCallback(async (cabinetId: string): Promise<string[]> => {
    try {
      return await repo.getCategories(cabinetId);
    } catch {
      return [];
    }
  }, []);

  return {
    demands,
    isLoading,
    error,
    fetchDemands,
    createDemand,
    updateDemandStatus,
    updateDemand,
    deleteDemand,
    getCategories,
    setDemands,
  };
}
