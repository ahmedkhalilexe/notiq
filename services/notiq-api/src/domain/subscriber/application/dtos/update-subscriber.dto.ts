export interface UpdateSubscriberDTO {
  id: string;
  tenantId?: string;
  externalId?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  channels?: {
    channel: string;
    enabled?: boolean;
    value?: string | null;
  }[];
}
