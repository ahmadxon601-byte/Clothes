const SUSPICIOUS_MOJIBAKE_PATTERN = /(?:Ã.|Â.|Ð.|Ñ.|â€|â€™|â€œ|â€)/;

export function repairText(input: string): string {
  if (!input || !SUSPICIOUS_MOJIBAKE_PATTERN.test(input)) return input;

  try {
    let current = input;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (!SUSPICIOUS_MOJIBAKE_PATTERN.test(current)) break;

      const bytes = Uint8Array.from(Array.from(current, (char) => char.charCodeAt(0) & 0xff));
      const decoded = new TextDecoder('utf-8').decode(bytes);

      if (decoded.includes('�') || decoded.includes('Ã¯Â¿Â½') || decoded === current) break;
      current = decoded;
    }

    return current;
  } catch {
    return input;
  }
}

export function repairTextTree<T>(value: T): T {
  if (typeof value === 'string') {
    return repairText(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => repairTextTree(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, repairTextTree(item)])
    ) as T;
  }

  return value;
}
