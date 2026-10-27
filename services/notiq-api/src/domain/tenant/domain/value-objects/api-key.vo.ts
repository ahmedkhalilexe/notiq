import { TenantApiKeyInvalidError } from "../errors/tenant-api-key-invalid.error";
import { createHash, randomUUID } from "node:crypto";
const API_KEY_PATTERN = /^ntk_[0-9a-f]{32}$/;
export class ApiKey {
  private constructor(public readonly value: string) {}

  static generate(): ApiKey {
    const raw = "ntk_" + randomUUID().replace(/-/g, "");
    return new ApiKey(raw);
  }

  static create(value: string): ApiKey {
    if (!API_KEY_PATTERN.test(value)) throw new TenantApiKeyInvalidError();
    return new ApiKey(value);
  }

  hash(): string {
    return createHash("sha256").update(this.value).digest("hex");
  }

  equals(other: ApiKey): boolean {
    return this.value === other.value;
  }
}
