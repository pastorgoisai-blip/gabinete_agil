import type { User, UserRole, UserStatus } from '../entities/User';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByCabinetId(cabinetId: string): Promise<User[]>;
  findByEmail(email: string): Promise<User | null>;
  save(user: Omit<User, 'id'>): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  updateRole(id: string, role: UserRole): Promise<void>;
  updateStatus(id: string, status: UserStatus): Promise<void>;
  delete(id: string): Promise<void>;
}
