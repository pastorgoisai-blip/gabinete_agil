import type { Project } from '../../domain/entities/Project';

export class ProjectMapper {
  static toDomain(raw: Record<string, unknown>): Project {
    return {
      id: String(raw.id),
      type: raw.type as string,
      number: raw.number as string,
      year: raw.year as string,
      author: raw.author as string,
      summary: (raw.summary as string) || '',
      status: raw.status as Project['status'],
      deadline: (raw.deadline as string) || undefined,
      documentUrl: (raw.document_url as string) || undefined,
      createdAt: (raw.created_at as string) || undefined,
    };
  }

  static toPersistence(entity: Partial<Project>): Record<string, unknown> {
    const record: Record<string, unknown> = {};

    if (entity.type !== undefined) record.type = entity.type;
    if (entity.number !== undefined) record.number = entity.number;
    if (entity.year !== undefined) record.year = entity.year;
    if (entity.author !== undefined) record.author = entity.author;
    if (entity.summary !== undefined) record.summary = entity.summary;
    if (entity.status !== undefined) record.status = entity.status;
    if (entity.deadline !== undefined) record.deadline = entity.deadline || null;
    if (entity.documentUrl !== undefined) record.document_url = entity.documentUrl;

    return record;
  }
}
