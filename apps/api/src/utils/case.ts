function camelKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function snakeKey(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function toCamel<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => toCamel(item)) as T;
  }

  if (input && typeof input === "object" && !(input instanceof Date)) {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [camelKey(key), toCamel(value)]),
    ) as T;
  }

  return input;
}

export function toSnake<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => toSnake(item)) as T;
  }

  if (input && typeof input === "object" && !(input instanceof Date)) {
    return Object.fromEntries(
      Object.entries(input)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [snakeKey(key), toSnake(value)]),
    ) as T;
  }

  return input;
}
