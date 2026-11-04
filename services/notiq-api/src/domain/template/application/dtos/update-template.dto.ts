export type UpdateTemplateDTO = {
  tenantId: string;
  id: string;
  name?: string;
  channel?: string;
  subject?: string;
  body?: string;
  variables?: { key: string; required?: boolean }[];
};
