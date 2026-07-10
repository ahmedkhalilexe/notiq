export class Password {
  private constructor(public readonly value: string) {}
  static create(hashedPassword: string) {
    return new Password(hashedPassword);
  }
  equals(other: Password): boolean {
    return this.value === other.value;
  }
}
