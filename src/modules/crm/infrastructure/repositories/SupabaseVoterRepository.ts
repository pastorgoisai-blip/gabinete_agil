import { supabase } from '../../../../../lib/supabase';
import type { Voter } from '../../domain/entities/Voter';
import type { IVoterRepository, VoterFilters } from '../../domain/repositories/IVoterRepository';
import { VoterMapper } from '../mappers/VoterMapper';
import { RepositoryError } from '../../../shared/infrastructure/RepositoryError';

export class SupabaseVoterRepository implements IVoterRepository {
  async findById(id: string): Promise<Voter | null> {
    try {
      const { data, error } = await supabase
        .from('voters')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return VoterMapper.toDomain(data);
    } catch (err) {
      throw RepositoryError.fromSupabase('Voter.findById', err);
    }
  }

  async findByCabinetId(cabinetId: string, filters?: VoterFilters): Promise<Voter[]> {
    try {
      let query = supabase
        .from('voters')
        .select('*')
        .eq('cabinet_id', cabinetId)
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,cpf.ilike.%${filters.search}%,address.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(VoterMapper.toDomain);
    } catch (err) {
      throw RepositoryError.fromSupabase('Voter.findByCabinetId', err);
    }
  }

  async save(cabinetId: string, voter: Omit<Voter, 'id'>): Promise<Voter> {
    try {
      const persistence = VoterMapper.toPersistence(voter);
      persistence.cabinet_id = cabinetId;

      const { data, error } = await supabase
        .from('voters')
        .insert([persistence])
        .select()
        .single();

      if (error) throw error;

      return VoterMapper.toDomain(data);
    } catch (err) {
      throw RepositoryError.fromSupabase('Voter.save', err);
    }
  }

  async saveBatch(cabinetId: string, voters: Omit<Voter, 'id'>[]): Promise<Voter[]> {
    try {
      const records = voters.map(v => ({
        ...VoterMapper.toPersistence(v),
        cabinet_id: cabinetId,
      }));

      const { data, error } = await supabase
        .from('voters')
        .insert(records)
        .select();

      if (error) throw error;

      return (data || []).map(VoterMapper.toDomain);
    } catch (err) {
      throw RepositoryError.fromSupabase('Voter.saveBatch', err);
    }
  }

  async update(id: string, updates: Partial<Voter>): Promise<Voter> {
    try {
      const persistence = VoterMapper.toPersistence(updates);

      const { data, error } = await supabase
        .from('voters')
        .update(persistence)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return VoterMapper.toDomain(data);
    } catch (err) {
      throw RepositoryError.fromSupabase('Voter.update', err);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('voters')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      throw RepositoryError.fromSupabase('Voter.delete', err);
    }
  }

  async countByCabinetId(cabinetId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('voters')
        .select('*', { count: 'exact', head: true })
        .eq('cabinet_id', cabinetId);

      if (error) throw error;

      return count || 0;
    } catch (err) {
      throw RepositoryError.fromSupabase('Voter.countByCabinetId', err);
    }
  }
}
