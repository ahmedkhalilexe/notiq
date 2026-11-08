import { describe, expect, it } from "bun:test";
import { NotFoundError } from "../shared/errors/not-found-error";
import type { DomainEvent } from "../shared/events";
import type { IEventDispatcher } from "../shared/ports";
import { CreateTemplateUsecase } from "./application/use-cases/create-template.use-case";
import { DeleteTemplateUsecase } from "./application/use-cases/delete-template.use-case";
import { GetTemplateUsecase } from "./application/use-cases/get-template.use-case";
import { ListTemplateUsecase } from "./application/use-cases/list-template.use-case";
import { UpdateTemplateUsecase } from "./application/use-cases/update-template.use-case";
import { Template } from "./domain/entities/template.entity";
import { TemplateNameInvalidError } from "./domain/errors/template-name-invalid.error";
import { TemplateSubjectInvalidError } from "./domain/errors/template-subject-invalid.error";
import { TemplateVariableExistsError } from "./domain/errors/template-variable-duplicate.error";
import type { ITemplateRepository } from "./domain/repositories/template-repository.interface";
import { TemplateBody } from "./domain/value-objects/template-body.vo";
import { TemplateChannel } from "./domain/value-objects/template-channel.vo";
import { TemplateVariable } from "./domain/value-objects/template-variable.vo";
import {
  createTemplateSchema,
  updateTemplateSchema,
} from "./infrastructure/http/template.validator";
import { TemplateMapper } from "./infrastructure/mappers/template.mapper";

const TENANT_A = "11111111-1111-4111-8111-111111111111";
const TENANT_B = "22222222-2222-4222-8222-222222222222";

class MockTemplateRepository implements ITemplateRepository {
  public templates: Map<string, Template> = new Map();

  async save(template: Template): Promise<void> {
    this.templates.set(template.id, template);
  }

  async update(template: Template): Promise<void> {
    this.templates.set(template.id, template);
  }

  async findById(id: string, tenantId: string): Promise<Template | null> {
    const t = this.templates.get(id);
    if (!t || t.deletedAt !== null || t.tenantId !== tenantId) return null;
    return t;
  }

  async list(
    tenantId: string,
    page: number,
    limit: number,
    channel?: string,
  ): Promise<Template[]> {
    let all = Array.from(this.templates.values()).filter(
      (t) => t.deletedAt === null && t.tenantId === tenantId,
    );
    if (channel) {
      all = all.filter((t) => t.channel.value === channel);
    }
    const offset = (page - 1) * limit;
    return all.slice(offset, offset + limit);
  }
}

class MockEventDispatcher implements IEventDispatcher {
  public dispatched: DomainEvent[] = [];

  async dispatch(events: DomainEvent[]): Promise<void> {
    this.dispatched.push(...events);
  }
}

describe("Template Domain Entity", () => {
  it("should create a template with valid fields and emit TemplateCreatedEvent", () => {
    const channel = TemplateChannel.create("email");
    const body = TemplateBody.create("Hello {{name}}, welcome to Notiq!");
    const template = Template.create(
      TENANT_A,
      "Welcome Email",
      channel,
      "Welcome!",
      body,
    );

    expect(template.id).toBeDefined();
    expect(template.name).toBe("Welcome Email");
    expect(template.channel.value).toBe("email");
    expect(template.subject).toBe("Welcome!");
    expect(template.body.value).toBe("Hello {{name}}, welcome to Notiq!");
    expect(template.events.length).toBe(1);
    expect(template.deletedAt).toBeNull();
  });

  it("should throw error if name is too short or too long", () => {
    const channel = TemplateChannel.create("email");
    const body = TemplateBody.create("Body content");

    expect(() =>
      Template.create(TENANT_A, "a", channel, "Subject", body),
    ).toThrow(TemplateNameInvalidError);
    expect(() =>
      Template.create(TENANT_A, "a".repeat(101), channel, "Subject", body),
    ).toThrow(TemplateNameInvalidError);
  });

  it("should throw error if subject is invalid", () => {
    const channel = TemplateChannel.create("email");
    const body = TemplateBody.create("Body content");

    expect(() =>
      Template.create(TENANT_A, "Valid Name", channel, "a", body),
    ).toThrow(TemplateSubjectInvalidError);
  });

  it("should throw error on invalid channel", () => {
    expect(() => TemplateChannel.create("invalid-channel")).toThrow();
  });

  it("should support adding, getting, and removing variables", () => {
    const template = Template.create(
      TENANT_A,
      "Test Template",
      TemplateChannel.sms(),
      "Subject line",
      TemplateBody.create("OTP: {{otp}}"),
    );

    const v1 = TemplateVariable.create("otp", true);
    template.addVariable(v1);
    expect(template.getVariables().length).toBe(1);

    expect(() => template.addVariable(v1)).toThrow(TemplateVariableExistsError);

    template.removeVariable("otp");
    expect(template.getVariables().length).toBe(0);
  });

  it("should update template fields and emit TemplateUpdatedEvent", () => {
    const template = Template.create(
      TENANT_A,
      "Initial Name",
      TemplateChannel.email(),
      "Initial Subject",
      TemplateBody.create("Initial body"),
    );
    template.clearEvents();

    template.update({
      name: "Updated Name",
      subject: "Updated Subject",
      channel: TemplateChannel.inApp(),
      body: TemplateBody.create("Updated body"),
    });

    expect(template.name).toBe("Updated Name");
    expect(template.subject).toBe("Updated Subject");
    expect(template.channel.value).toBe("in_app");
    expect(template.body.value).toBe("Updated body");
    expect(template.events.length).toBe(1);
  });

  it("should soft delete template and disallow further updates", () => {
    const template = Template.create(
      TENANT_A,
      "Delete Me",
      TemplateChannel.email(),
      "Subject",
      TemplateBody.create("Body"),
    );
    template.clearEvents();

    template.delete();
    expect(template.deletedAt).not.toBeNull();
    expect(template.events.length).toBe(1);

    expect(() => template.delete()).toThrow("template already deleted");
    expect(() => template.update({ name: "Cannot Update" })).toThrow(
      "Cannot update a deleted template",
    );
  });
});

describe("Template Application Use Cases", () => {
  it("CreateTemplateUsecase should auto-extract variables from body if none provided", async () => {
    const repo = new MockTemplateRepository();
    const dispatcher = new MockEventDispatcher();
    const useCase = new CreateTemplateUsecase(repo, dispatcher);

    const template = await useCase.execute({
      tenantId: TENANT_A,
      name: "Reset Password",
      channel: "email",
      subject: "Reset your password",
      body: "Hello {{username}}, click here: {{reset_link}} to reset.",
    });

    expect(repo.templates.has(template.id)).toBe(true);
    expect(dispatcher.dispatched.length).toBe(1);
    const variables = template.getVariables();
    expect(variables.length).toBe(2);
    expect(variables.map((v) => v.key)).toContain("username");
    expect(variables.map((v) => v.key)).toContain("reset_link");
  });

  it("UpdateTemplateUsecase should update template attributes", async () => {
    const repo = new MockTemplateRepository();
    const dispatcher = new MockEventDispatcher();
    const createUseCase = new CreateTemplateUsecase(repo, dispatcher);
    const updateUseCase = new UpdateTemplateUsecase(repo, dispatcher);

    const created = await createUseCase.execute({
      tenantId: TENANT_A,
      name: "Original",
      channel: "email",
      subject: "Original subject",
      body: "Original body",
    });

    const updated = await updateUseCase.execute({
      id: created.id,
      tenantId: TENANT_A,
      name: "Modified Name",
      channel: "sms",
    });

    expect(updated.name).toBe("Modified Name");
    expect(updated.channel.value).toBe("sms");
    expect(updated.subject).toBe("Original subject");
  });

  it("GetTemplateUsecase should retrieve an existing template or throw NotFoundError", async () => {
    const repo = new MockTemplateRepository();
    const dispatcher = new MockEventDispatcher();
    const createUseCase = new CreateTemplateUsecase(repo, dispatcher);
    const getUseCase = new GetTemplateUsecase(repo);

    const created = await createUseCase.execute({
      tenantId: TENANT_A,
      name: "Fetch Me",
      channel: "email",
      subject: "Subject",
      body: "Body",
    });

    const fetched = await getUseCase.execute({
      id: created.id,
      tenantId: TENANT_A,
    });
    expect(fetched.id).toBe(created.id);

    expect(
      getUseCase.execute({
        id: "00000000-0000-0000-0000-000000000000",
        tenantId: TENANT_A,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("ListTemplateUsecase should filter by channel and paginate", async () => {
    const repo = new MockTemplateRepository();
    const dispatcher = new MockEventDispatcher();
    const createUseCase = new CreateTemplateUsecase(repo, dispatcher);
    const listUseCase = new ListTemplateUsecase(repo, dispatcher);

    await createUseCase.execute({
      tenantId: TENANT_A,
      name: "Email 1",
      channel: "email",
      subject: "S1",
      body: "B1",
    });
    await createUseCase.execute({
      tenantId: TENANT_A,
      name: "Email 2",
      channel: "email",
      subject: "S2",
      body: "B2",
    });
    await createUseCase.execute({
      tenantId: TENANT_A,
      name: "SMS 1",
      channel: "sms",
      subject: "S3",
      body: "B3",
    });

    const emailList = await listUseCase.execute({
      tenantId: TENANT_A,
      page: 1,
      limit: 10,
      channel: "email",
    });
    expect(emailList.length).toBe(2);

    const smsList = await listUseCase.execute({
      tenantId: TENANT_A,
      page: 1,
      limit: 10,
      channel: "sms",
    });
    expect(smsList.length).toBe(1);

    const paginated = await listUseCase.execute({
      tenantId: TENANT_A,
      page: 1,
      limit: 1,
    });
    expect(paginated.length).toBe(1);
  });

  it("DeleteTemplateUsecase should soft delete the template", async () => {
    const repo = new MockTemplateRepository();
    const dispatcher = new MockEventDispatcher();
    const createUseCase = new CreateTemplateUsecase(repo, dispatcher);
    const deleteUseCase = new DeleteTemplateUsecase(repo, dispatcher);

    const created = await createUseCase.execute({
      tenantId: TENANT_A,
      name: "To be deleted",
      channel: "email",
      subject: "Subject",
      body: "Body",
    });

    await deleteUseCase.execute({ id: created.id, tenantId: TENANT_A });
    const found = await repo.findById(created.id, TENANT_A);
    expect(found).toBeNull();
  });
});

describe("Template tenant isolation", () => {
  async function setup() {
    const repo = new MockTemplateRepository();
    const dispatcher = new MockEventDispatcher();
    const created = await new CreateTemplateUsecase(repo, dispatcher).execute({
      tenantId: TENANT_A,
      name: "Tenant A template",
      channel: "email",
      subject: "Subject",
      body: "Body",
    });
    return { repo, dispatcher, created };
  }

  it("should not let another tenant get a template", async () => {
    const { repo, created } = await setup();
    expect(
      new GetTemplateUsecase(repo).execute({
        id: created.id,
        tenantId: TENANT_B,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should not let another tenant update a template", async () => {
    const { repo, dispatcher, created } = await setup();
    expect(
      new UpdateTemplateUsecase(repo, dispatcher).execute({
        id: created.id,
        tenantId: TENANT_B,
        name: "Hijacked",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should not let another tenant delete a template", async () => {
    const { repo, dispatcher, created } = await setup();
    expect(
      new DeleteTemplateUsecase(repo, dispatcher).execute({
        id: created.id,
        tenantId: TENANT_B,
      }),
    ).rejects.toThrow(NotFoundError);
    expect(await repo.findById(created.id, TENANT_A)).not.toBeNull();
  });

  it("should only list templates of the requesting tenant", async () => {
    const { repo } = await setup();
    const list = new ListTemplateUsecase(repo);
    expect(
      (await list.execute({ tenantId: TENANT_B, page: 1, limit: 10 })).length,
    ).toBe(0);
    expect(
      (await list.execute({ tenantId: TENANT_A, page: 1, limit: 10 })).length,
    ).toBe(1);
  });
});

describe("TemplateMapper & Validator", () => {
  it("should map between domain, persistence, and response DTO", () => {
    const template = Template.create(
      TENANT_A,
      "Test",
      TemplateChannel.email(),
      "Subj",
      TemplateBody.create("Body {{var}}"),
      [TemplateVariable.create("var", true)],
    );

    const persistence = TemplateMapper.toPersistence(template);
    expect(persistence.name).toBe("Test");
    expect(persistence.channel).toBe("email");

    const domain = TemplateMapper.toDomain({
      ...persistence,
      variables: [{ key: "var", required: true }],
    });
    expect(domain.name).toBe("Test");
    expect(domain.getVariables().length).toBe(1);

    const response = TemplateMapper.toResponse(domain);
    expect(response.name).toBe("Test");
    expect(response.variables[0]?.key).toBe("var");
  });

  it("should validate createTemplateSchema and updateTemplateSchema", () => {
    const validCreate = {
      name: "Welcome",
      channel: "email",
      subject: "Hello",
      body: "Welcome to our app!",
    };
    const { error: createError } = createTemplateSchema.validate(validCreate);
    expect(createError).toBeUndefined();

    const invalidChannel = {
      ...validCreate,
      channel: "push_notification",
    };
    const { error: channelError } =
      createTemplateSchema.validate(invalidChannel);
    expect(channelError).toBeDefined();

    const { error: emptyUpdateError } = updateTemplateSchema.validate({});
    expect(emptyUpdateError).toBeDefined();

    const { error: validUpdateError } = updateTemplateSchema.validate({
      name: "New Name",
    });
    expect(validUpdateError).toBeUndefined();
  });
});
