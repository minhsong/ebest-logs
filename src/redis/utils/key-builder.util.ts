export class KeyBuilder {
  constructor(private readonly prefix: string) {
    if (!prefix.endsWith(':')) {
      this.prefix = `${prefix}:`;
    }
  }

  build(...parts: (string | number | undefined)[]): string {
    const filteredParts = parts.filter(
      (part) => part !== undefined && part !== null && part !== '',
    );
    const key = filteredParts.map(String).join(':');
    return `${this.prefix}${key}`;
  }
}
