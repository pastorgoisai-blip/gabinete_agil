import type { Voter, VoterCategory, VoterStatus } from '../entities/Voter';

export interface VoterFilters {
  search?: string;
  category?: VoterCategory;
  status?: VoterStatus;
  hasBirthdayThisMonth?: boolean;
}

export interface IVoterRepository {
  findById(id: string): Promise<Voter | null>;
  findByCabinetId(cabinetId: string, filters?: VoterFilters): Promise<Voter[]>;
  save(cabinetId: string, voter: Omit<Voter, 'id'>): Promise<Voter>;
  saveBatch(cabinetId: string, voters: Omit<Voter, 'id'>[]): Promise<Voter[]>;
  update(id: string, data: Partial<Voter>): Promise<Voter>;
  delete(id: string): Promise<void>;
  countByCabinetId(cabinetId: string): Promise<number>;
}
