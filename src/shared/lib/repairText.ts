const SUSPICIOUS_MOJIBAKE_PATTERN = /[ÐÑÂâð]/;

export function repairText(input: string): string {
  if (!input || !SUSPICIOUS_MOJIBAKE_PATTERN.test(input)) return input;

  try {
    const bytes = Uint8Array.from(Array.from(input, (char) => char.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder('utf-8').decode(bytes);
    return decoded.includes('�') ? input : decoded;
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
