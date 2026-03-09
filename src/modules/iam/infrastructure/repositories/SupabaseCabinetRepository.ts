import { supabase } from '../../../../../lib/supabase';
import type { Cabinet } from '../../domain/entities/Cabinet';
import type { ICabinetRepository } from '../../domain/repositories/ICabinetRepository';
import { CabinetMapper } from '../mappers/CabinetMapper';
import { RepositoryError } from '../../../shared/infrastructure/RepositoryError';

export class SupabaseCabinetRepository implements ICabinetRepository {
  async findById(id: string): Promise<Cabinet | null> {
    try {
      const { data, error } = await supabase
        .from('cabinets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return CabinetMapper.toDomain(data);
    } catch (err) {
      throw RepositoryError.fromSupabase('Cabinet.findById', err);
    }
  }

  async findAll(): Promise<Cabinet[]> {
    try {
      const { data, error } = await supabase
        .from('cabinets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(CabinetMapper.toDomain);
    } catch (err) {
      throw RepositoryError.fromSupabase('Cabinet.findAll', err);
    }
  }

  async save(cabinet: Omit<Cabinet, 'id' | 'createdAt'>): Promise<Cabinet> {
    try {
      const persistence = CabinetMapper.toPersistence(cabinet);

      const { data, error } = await supabase
        .from('cabinets')
        .insert([persistence])
        .select()
        .single();

      if (error) throw error;

      return CabinetMapper.toDomain(data);
    } catch (err) {
      throw RepositoryError.fromSupabase('Cabinet.save', err);
    }
  }

  async update(id: string, updates: Partial<Cabinet>): Promise<Cabinet> {
    try {
      const persistence = CabinetMapper.toPersistence(updates);

      const { data, error } = await supabase
        .from('cabinets')
        .update(persistence)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return CabinetMapper.toDomain(data);
    } catch (err) {
      throw RepositoryError.fromSupabase('Cabinet.update', err);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cabinets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      throw RepositoryError.fromSupabase('Cabinet.delete', err);
    }
  }
}
