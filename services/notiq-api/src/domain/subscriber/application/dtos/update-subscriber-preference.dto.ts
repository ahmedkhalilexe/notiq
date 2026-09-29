export interface UpdateSubscriberPreferenceDTO {
  id: string;
  tenantId?: string;
  channel: string;
  enabled: boolean;
  value?: string | null;
}
