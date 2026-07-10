import type { DomainEvent } from "../../../shared/events";
import { TenantEmailInvalidError } from "../errors/tenant-email-invalid.error";
import { TenantNameInvalidError } from "../errors/tenant-name-invalid.error";
import { TenantCreatedEvent } from "../events/tenant-created.event";
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
    );

    tenant._events.push(new TenantCreatedEvent(tenant.id));

    return tenant;
  }
  static reconstitute(
    id: string,
    name: string,
    email: string,
    password: Password,
    apiKey: ApiKey,
    createdAt: Date,
  ): Tenant {
    return new Tenant(id, name, email, password, apiKey, createdAt);
  }
  get events(): DomainEvent[] {
    return [...this._events];
  }
  public clearEvents() {
    this._events = [];
  }
}
