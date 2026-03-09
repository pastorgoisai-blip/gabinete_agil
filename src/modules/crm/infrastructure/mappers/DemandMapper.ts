import type { Demand } from '../../domain/entities/Demand';

export class DemandMapper {
  static toDomain(raw: Record<string, unknown>): Demand {
    const profiles = raw.profiles as Record<string, unknown> | null;

    return {
      id: String(raw.id),
      title: raw.title as string,
      description: (raw.description as string) || '',
      beneficiary: (raw.beneficiary as string) || '',
      author: (profiles?.name as string) || (raw.author as string) || 'Sistema',
      category: (raw.category as string) || 'Outros',
      status: raw.status as Demand['status'],
      priority: (raw.priority as Demand['priority']) || 'Média',
      obs: (raw.obs as string) || undefined,
      createdAt: (raw.created_at as string) || undefined,
      updatedAt: (raw.updated_at as string) || undefined,
      createdBy: (raw.created_by as string) || undefined,
      assignedTo: (raw.assigned_to as string) || undefined,
    };
  }

  static toPersistence(entity: Partial<Demand>): Record<string, unknown> {
    const record: Record<string, unknown> = {};

    if (entity.title !== undefined) record.title = entity.title;
    if (entity.description !== undefined) record.description = entity.description;
    if (entity.beneficiary !== undefined) record.beneficiary = entity.beneficiary;
    if (entity.category !== undefined) record.category = entity.category;
    if (entity.status !== undefined) record.status = entity.status;
    if (entity.priority !== undefined) record.priority = entity.priority;
    if (entity.obs !== undefined) record.obs = entity.obs;
    if (entity.assignedTo !== undefined) record.assigned_to = entity.assignedTo;
    if (entity.createdBy !== undefined) record.created_by = entity.createdBy;

    return record;
  }
}
