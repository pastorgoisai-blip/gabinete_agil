export type { Voter, VoterCategory, VoterStatus, VoterSource } from './entities/Voter';
export type { Demand, DemandStatusValue, DemandPriority } from './entities/Demand';
export type { Notification, NotificationType, NotificationCategory } from './entities/Notification';

export { CPF } from './value-objects/CPF';
export { Email } from './value-objects/Email';
export { DemandStatus } from './value-objects/DemandStatus';

export type { IVoterRepository, VoterFilters } from './repositories/IVoterRepository';
export type { IDemandRepository, DemandFilters } from './repositories/IDemandRepository';
