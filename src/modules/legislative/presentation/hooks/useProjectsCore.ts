import { useState, useCallback } from 'react';
import type { Project } from '../../domain/entities/Project';
import type { ProjectFilters } from '../../domain/repositories/IProjectRepository';
import type { CreateProjectInput } from '../../use_cases/CreateProjectUseCase';
import { SupabaseProjectRepository } from '../../infrastructure/repositories/SupabaseProjectRepository';
import { ListProjectsUseCase } from '../../use_cases/ListProjectsUseCase';
import { CreateProjectUseCase } from '../../use_cases/CreateProjectUseCase';
import { RepositoryError } from '../../../shared/infrastructure/RepositoryError';

interface UseProjectsCoreReturn {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  fetchProjects: (cabinetId: string, filters?: ProjectFilters) => Promise<void>;
  createProject: (cabinetId: string, input: CreateProjectInput) => Promise<{ success: boolean; error?: string }>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<{ success: boolean; error?: string }>;
  deleteProject: (id: string) => Promise<{ success: boolean; error?: string }>;
}

function formatError(err: unknown): string {
  if (err instanceof RepositoryError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Erro desconhecido.';
}

export function useProjectsCore(): UseProjectsCoreReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const repo = new SupabaseProjectRepository();

  const fetchProjects = useCallback(async (cabinetId: string, filters?: ProjectFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const useCase = new ListProjectsUseCase(repo);
      const result = await useCase.execute(cabinetId, filters);
      setProjects(result);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProject = useCallback(async (cabinetId: string, input: CreateProjectInput) => {
    setError(null);
    try {
      const useCase = new CreateProjectUseCase(repo);
      const newProject = await useCase.execute(cabinetId, input);
      setProjects(prev => [newProject, ...prev]);
      return { success: true };
    } catch (err) {
      const message = formatError(err);
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    setError(null);
    try {
      const updated = await repo.update(id, updates);
      setProjects(prev => prev.map(p => (p.id === id ? updated : p)));
      return { success: true };
    } catch (err) {
      const message = formatError(err);
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    setError(null);
    try {
      await repo.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      return { success: true };
    } catch (err) {
      const message = formatError(err);
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  return { projects, isLoading, error, fetchProjects, createProject, updateProject, deleteProject };
}
