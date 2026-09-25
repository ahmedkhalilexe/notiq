import type { DomainEvent } from "../../../shared/events";
import { TemplateNameInvalidError } from "../errors/template-name-invalid.error";
import { TemplateSubjectInvalidError } from "../errors/template-subject-invalid.error";
import { TemplateCreatedEvent } from "../events/template-created.event";
import { TemplateDeletedEvent } from "../events/template-deleted.event";
import { TemplateUpdatedEvent } from "../events/template-updated.event";
import type { TemplateChannel } from "../value-objects/template-channel.vo";
import type { TemplateBody } from "../value-objects/template-body.vo";
import type { TemplateVariable } from "../value-objects/template-variable.vo";
import { TemplateVariableExistsError } from "../errors/template-variable-duplicate.error";

export class Template {
  private _events: DomainEvent[] = [];

  public constructor(
    readonly id: string,
    private _name: string,
    private _channel: TemplateChannel,
    private _subject: string,
    private _body: TemplateBody,
    private variables: TemplateVariable[] = [],
    readonly createdAt: Date,
    private _deletedAt: Date | null,
  ) {}

  public static create(
    name: string,
    channel: TemplateChannel,
    subject: string,
    body: TemplateBody,
    variables: TemplateVariable[] = [],
  ) {
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      throw new TemplateNameInvalidError();
    }

    const trimmedSubject = subject.trim();
    if (trimmedSubject.length < 2 || trimmedSubject.length > 100) {
      throw new TemplateSubjectInvalidError();
    }

    const id = crypto.randomUUID();

    const template = new Template(
      id,
      trimmedName,
      channel,
      trimmedSubject,
      body,
      variables,
      new Date(),
      null,
    );

    template._events.push(new TemplateCreatedEvent(template.id));

    return template;
  }

  public static reconstitute(
    id: string,
    name: string,
    channel: TemplateChannel,
    subject: string,
    body: TemplateBody,
    variables: TemplateVariable[] = [],
    createdAt: Date,
    deletedAt: Date | null,
  ) {
    return new Template(
      id,
      name,
      channel,
      subject,
      body,
      variables,
      createdAt,
      deletedAt,
    );
  }

  public update(params: {
    name?: string;
    channel?: TemplateChannel;
    subject?: string;
    body?: TemplateBody;
    variables?: TemplateVariable[];
  }): void {
    if (this._deletedAt != null) {
      throw new Error("Cannot update a deleted template");
    }

    if (params.name !== undefined) {
      const trimmedName = params.name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 100) {
        throw new TemplateNameInvalidError();
      }
      this._name = trimmedName;
    }

    if (params.subject !== undefined) {
      const trimmedSubject = params.subject.trim();
      if (trimmedSubject.length < 2 || trimmedSubject.length > 100) {
        throw new TemplateSubjectInvalidError();
      }
      this._subject = trimmedSubject;
    }

    if (params.channel !== undefined) {
      this._channel = params.channel;
    }

    if (params.body !== undefined) {
      this._body = params.body;
    }

    if (params.variables !== undefined) {
      const seen = new Set<string>();
      for (const v of params.variables) {
        if (seen.has(v.key)) {
          throw new TemplateVariableExistsError();
        }
        seen.add(v.key);
      }
      this.variables = [...params.variables];
    }

    this._events.push(new TemplateUpdatedEvent(this.id));
  }

  public delete(): void {
    if (this.deletedAt != null) {
      throw Error("template already deleted");
    }

    this._deletedAt = new Date();

    this._events.push(new TemplateDeletedEvent(this.id, this._deletedAt));
  }

  addVariable(variable: TemplateVariable): void {
    if (this.variables.some((v) => v.key === variable.key)) {
      throw new TemplateVariableExistsError();
    }
    this.variables.push(variable);
  }

  removeVariable(key: string): void {
    this.variables = this.variables.filter((v) => v.key !== key);
  }

  getVariables(): ReadonlyArray<TemplateVariable> {
    return this.variables;
  }

  get name(): string {
    return this._name;
  }

  get channel(): TemplateChannel {
    return this._channel;
  }

  get subject(): string {
    return this._subject;
  }

  get body(): TemplateBody {
    return this._body;
  }

  get events(): DomainEvent[] {
    return [...this._events];
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  public clearEvents() {
    this._events = [];
  }
}
