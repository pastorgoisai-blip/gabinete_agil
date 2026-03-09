import type { Cabinet } from '../../domain/entities/Cabinet';

export class CabinetMapper {
  static toDomain(raw: Record<string, unknown>): Cabinet {
    return {
      id: raw.id as string,
      name: raw.name as string,
      createdAt: raw.created_at as string,
      officialName: (raw.official_name as string) || undefined,
      officialTitle: (raw.official_title as string) || undefined,
      headerUrl: (raw.header_url as string) || undefined,
      footerUrl: (raw.footer_url as string) || undefined,
      useLetterhead: (raw.use_letterhead as boolean) || undefined,
      agentAccessToken: (raw.agent_access_token as string) || undefined,
      googleAccessToken: (raw.google_access_token as string) || undefined,
      googleRefreshToken: (raw.google_refresh_token as string) || undefined,
      googleCalendarId: (raw.google_calendar_id as string) || undefined,
    };
  }

  static toPersistence(entity: Partial<Cabinet>): Record<string, unknown> {
    const record: Record<string, unknown> = {};

    if (entity.name !== undefined) record.name = entity.name;
    if (entity.officialName !== undefined) record.official_name = entity.officialName;
    if (entity.officialTitle !== undefined) record.official_title = entity.officialTitle;
    if (entity.headerUrl !== undefined) record.header_url = entity.headerUrl;
    if (entity.footerUrl !== undefined) record.footer_url = entity.footerUrl;
    if (entity.useLetterhead !== undefined) record.use_letterhead = entity.useLetterhead;
    if (entity.agentAccessToken !== undefined) record.agent_access_token = entity.agentAccessToken;
    if (entity.googleAccessToken !== undefined) record.google_access_token = entity.googleAccessToken;
    if (entity.googleRefreshToken !== undefined) record.google_refresh_token = entity.googleRefreshToken;
    if (entity.googleCalendarId !== undefined) record.google_calendar_id = entity.googleCalendarId;

    return record;
  }
}
