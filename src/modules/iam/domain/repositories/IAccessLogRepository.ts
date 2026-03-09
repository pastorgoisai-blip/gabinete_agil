import type { AccessLog } from '../entities/AccessLog';

export interface IAccessLogRepository {
  log(entry: Omit<AccessLog, 'id'>): Promise<void>;
  findByUserId(userId: string): Promise<AccessLog[]>;
  findByCabinetId(cabinetId: string): Promise<AccessLog[]>;
}
