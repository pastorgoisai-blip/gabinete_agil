export interface Cabinet {
  id: string;
  name: string;
  createdAt: string;
  officialName?: string;
  officialTitle?: string;
  headerUrl?: string;
  footerUrl?: string;
  useLetterhead?: boolean;
  agentAccessToken?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleCalendarId?: string;
}
