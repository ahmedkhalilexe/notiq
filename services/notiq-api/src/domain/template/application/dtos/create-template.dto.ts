export type CreateTemplateDTO = {
  tenantId: string;
  name: string;
  channel: string;
  subject: string;
  body: string;
  variables?: { key: string; required?: boolean }[];
};
