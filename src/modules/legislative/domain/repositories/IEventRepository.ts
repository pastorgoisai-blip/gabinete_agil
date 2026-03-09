import type { Event, EventType, EventStatus } from '../entities/Event';

export interface EventFilters {
  type?: EventType;
  status?: EventStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface IEventRepository {
  findById(id: string): Promise<Event | null>;
  findByCabinetId(cabinetId: string, filters?: EventFilters): Promise<Event[]>;
  save(cabinetId: string, event: Omit<Event, 'id'>): Promise<Event>;
  update(id: string, data: Partial<Event>): Promise<Event>;
  delete(id: string): Promise<void>;
}
