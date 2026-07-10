import type { DomainEvent } from "../../../shared/events";
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
    if (name.length < 2) {
      throw new Error("Tenant name must be at least 2 characters");
    }
    if (email.length < 4) {
      throw new Error("Tenant email must be at least 4 characters");
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
