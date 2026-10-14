export interface CreateSubscriberChannelDTO {
  channel: string;
  enabled?: boolean;
  value?: string | null;
}

export interface CreateSubscriberDTO {
  tenantId: string;
  externalId?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  channels?: CreateSubscriberChannelDTO[];
}
