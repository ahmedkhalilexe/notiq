export class ApiKey {
  private constructor(public readonly value: string) {}

  static generate(): ApiKey {
    const raw = "ntk_" + crypto.randomUUID().replace(/-/g, "");
    return new ApiKey(raw);
  }

  static create(value: string): ApiKey {
    return new ApiKey(value);
  }

  equals(other: ApiKey): boolean {
    return this.value === other.value;
  }
}
