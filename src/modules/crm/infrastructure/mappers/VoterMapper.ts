import type { Voter } from '../../domain/entities/Voter';

export class VoterMapper {
  static toDomain(raw: Record<string, unknown>): Voter {
    return {
      id: String(raw.id),
      name: raw.name as string,
      cpf: (raw.cpf as string) || undefined,
      phone: (raw.phone as string) || '',
      email: (raw.email as string) || undefined,
      address: (raw.address as string) || '',
      city: (raw.city as string) || undefined,
      neighborhood: (raw.neighborhood as string) || undefined,
      birthDate: (raw.birth_date as string) || undefined,
      category: raw.category as Voter['category'],
      status: (raw.status as Voter['status']) || 'active',
      source: (raw.source as Voter['source']) || undefined,
      createdBy: (raw.created_by as string) || undefined,
      indicatedBy: (raw.indicated_by as string) || undefined,
      avatarUrl: (raw.avatar_url as string) || undefined,
      tags: Array.isArray(raw.tags) ? raw.tags as string[] : undefined,
    };
  }

  static toPersistence(entity: Partial<Voter>): Record<string, unknown> {
    const record: Record<string, unknown> = {};

    if (entity.name !== undefined) record.name = entity.name;
    if (entity.cpf !== undefined) record.cpf = entity.cpf;
    if (entity.phone !== undefined) record.phone = entity.phone;
    if (entity.address !== undefined) record.address = entity.address;
    if (entity.city !== undefined) record.city = entity.city;
    if (entity.neighborhood !== undefined) record.neighborhood = entity.neighborhood;
    if (entity.birthDate !== undefined) record.birth_date = entity.birthDate;
    if (entity.category !== undefined) record.category = entity.category;
    if (entity.status !== undefined) record.status = entity.status;
    if (entity.source !== undefined) record.source = entity.source;
    if (entity.createdBy !== undefined) record.created_by = entity.createdBy;
    if (entity.indicatedBy !== undefined) record.indicated_by = entity.indicatedBy;
    if (entity.avatarUrl !== undefined) record.avatar_url = entity.avatarUrl;
    if (entity.tags !== undefined) record.tags = entity.tags;
    if (entity.email !== undefined) record.email = entity.email;

    return record;
  }
}
