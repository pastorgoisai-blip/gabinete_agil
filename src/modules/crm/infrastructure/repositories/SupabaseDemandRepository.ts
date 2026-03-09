import { supabase } from '../../../../../lib/supabase';
import type { Demand, DemandStatusValue } from '../../domain/entities/Demand';
import type { IDemandRepository, DemandFilters } from '../../domain/repositories/IDemandRepository';
import { DemandMapper } from '../mappers/DemandMapper';
import { RepositoryError } from '../../../shared/infrastructure/RepositoryError';

const DEMAND_SELECT = `
  *,
  profiles:created_by (
    name
  )
`;

export class SupabaseDemandRepository implements IDemandRepository {
  async findById(id: string): Promise<Demand | null> {
    try {
      const { data, error } = await supabase
        .from('demands')
        .select(DEMAND_SELECT)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return DemandMapper.toDomain(data);
    } catch (err) {
      throw RepositoryError.fromSupabase('Demand.findById', err);
    }
  }

  async findByCabinetId(cabinetId: string, filters?: DemandFilters): Promise<Demand[]> {
    try {
      let query = supabase
        .from('demands')
        .select(DEMAND_SELECT)
        .eq('cabinet_id', cabinetId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,beneficiary.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(DemandMapper.toDomain);
    } catch (err) {
      throw RepositoryError.fromSupabase('Demand.findByCabinetId', err);
    }
  }

  async save(
    cabinetId: string,
    demand: Omit<Demand, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Demand> {
    try {
      const persistence = DemandMapper.toPersistence(demand);
      persistence.cabinet_id = cabinetId;

      const { data, error } = await supabase
        .from('demands')
        .insert([persistence])
        .select(DEMAND_SELECT)
        .single();

      if (error) throw error;

      return DemandMapper.toDomain(data);
    } catch (err) {
      throw RepositoryError.fromSupabase('Demand.save', err);
    }
  }

  async update(id: string, updates: Partial<Demand>): Promise<Demand> {
    try {
      const persistence = DemandMapper.toPersistence(updates);

      const { data, error } = await supabase
        .from('demands')
        .update(persistence)
        .eq('id', id)
        .select(DEMAND_SELECT)
        .single();

      if (error) throw error;

      return DemandMapper.toDomain(data);
    } catch (err) {
      throw RepositoryError.fromSupabase('Demand.update', err);
    }
  }

  async updateStatus(id: string, status: DemandStatusValue): Promise<Demand> {
    return this.update(id, { status } as Partial<Demand>);
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('demands')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      throw RepositoryError.fromSupabase('Demand.delete', err);
    }
  }

  async getCategories(cabinetId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('demands')
        .select('category')
        .eq('cabinet_id', cabinetId);

      if (error) throw error;

      const categories = new Set<string>(
        (data || []).map((d: { category: string }) => d.category)
      );

      return Array.from(categories).sort();
    } catch (err) {
      throw RepositoryError.fromSupabase('Demand.getCategories', err);
    }
  }

  async countByCabinetId(cabinetId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('demands')
        .select('*', { count: 'exact', head: true })
        .eq('cabinet_id', cabinetId);

      if (error) throw error;

      return count || 0;
    } catch (err) {
      throw RepositoryError.fromSupabase('Demand.countByCabinetId', err);
    }
  }
}
