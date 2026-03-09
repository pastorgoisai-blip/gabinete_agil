import { supabase } from '../../../../../lib/supabase';
import type { Project } from '../../domain/entities/Project';
import type { IProjectRepository, ProjectFilters } from '../../domain/repositories/IProjectRepository';
import { ProjectMapper } from '../mappers/ProjectMapper';
import { RepositoryError } from '../../../shared/infrastructure/RepositoryError';

export class SupabaseProjectRepository implements IProjectRepository {
  async findById(id: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('legislative_projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return ProjectMapper.toDomain(data);
    } catch (err) {
      throw RepositoryError.fromSupabase('Project.findById', err);
    }
  }

  async findByCabinetId(cabinetId: string, filters?: ProjectFilters): Promise<Project[]> {
    try {
      let query = supabase
        .from('legislative_projects')
        .select('*')
        .eq('cabinet_id', cabinetId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.year) {
        query = query.eq('year', filters.year);
      }

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(ProjectMapper.toDomain);
    } catch (err) {
      throw RepositoryError.fromSupabase('Project.findByCabinetId', err);
    }
  }

  async save(cabinetId: string, project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    try {
      const persistence = ProjectMapper.toPersistence(project);
      persistence.cabinet_id = cabinetId;

      const { data, error } = await supabase
        .from('legislative_projects')
        .insert([persistence])
        .select()
        .single();

      if (error) throw error;

      return ProjectMapper.toDomain(data);
    } catch (err) {
      throw RepositoryError.fromSupabase('Project.save', err);
    }
  }

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    try {
      const persistence = ProjectMapper.toPersistence(updates);

      const { data, error } = await supabase
        .from('legislative_projects')
        .update(persistence)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return ProjectMapper.toDomain(data);
    } catch (err) {
      throw RepositoryError.fromSupabase('Project.update', err);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('legislative_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      throw RepositoryError.fromSupabase('Project.delete', err);
    }
  }
}
