import { throws } from "assert";
import type { DomainEvent } from "../../../shared/events";
import { TenantEmailInvalidError } from "../errors/tenant-email-invalid.error";
import { TenantNameInvalidError } from "../errors/tenant-name-invalid.error";
import { TenantCreatedEvent } from "../events/tenant-created.event";
import { TenantDeletedEvent } from "../events/tenant-deleted.event";
import { ApiKey } from "../value-objetcs/api-key.vo";
import { Password } from "../value-objetcs/password.vo";

export class Tenant {
  private _events: DomainEvent[] = [];
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly email: string,
    readonly password: Password,
    readonly apiKey: ApiKey,
    readonly createdAt: Date,
    private _deletedAt: Date | null,
  ) {}

  static create({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: Password;
  }): Tenant {
    const trimmedName = name.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      throw new TenantNameInvalidError();
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail) || normalizedEmail.length > 255) {
      throw new TenantEmailInvalidError();
    }

    const id = crypto.randomUUID();

    const tenant = new Tenant(
      id,
      name,
      email,
      password,
      ApiKey.generate(),
      new Date(),
      null,
    );

    tenant._events.push(new TenantCreatedEvent(tenant.id));

    return tenant;
  }

  public delete(): void {
    if (this.deletedAt != null) {
      throw Error("tenant already deleted");
    }

    this._deletedAt = new Date();
    this._events.push(new TenantDeletedEvent(this.id, this._deletedAt));
  }

  static reconstitute(
    id: string,
    name: string,
    email: string,
    password: Password,
    apiKey: ApiKey,
    createdAt: Date,
    deletedAt: Date | null,
  ): Tenant {
    return new Tenant(id, name, email, password, apiKey, createdAt, deletedAt);
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
