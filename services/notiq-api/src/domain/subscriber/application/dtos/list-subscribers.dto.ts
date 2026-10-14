export interface ListSubscribersDTO {
  tenantId?: string;
  page?: number;
  limit?: number;
  channel?: string;
  enabled?: boolean;
}
