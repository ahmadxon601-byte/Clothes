export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ApiRequestInit = RequestInit & {
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 8000;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const getBaseUrl = () => {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!fromEnv) {
    return "";
  }

  return trimTrailingSlash(fromEnv);
};

const makeUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = getBaseUrl();

  if (!baseUrl) {
    return normalizedPath;
  }

  return `${baseUrl}${normalizedPath}`;
};

const parseJson = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
};

export async function apiRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...restInit } = init;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(makeUrl(path), {
      ...restInit,
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      signal: controller.signal,
      cache: "no-store"
    });

    if (!response.ok) {
      throw new ApiError(`Request failed with ${response.status}`, response.status);
    }

    return await parseJson<T>(response);
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiGet<T>(path: string, init: ApiRequestInit = {}) {
  return apiRequest<T>(path, { ...init, method: "GET" });
}

export async function apiPost<T, B = unknown>(path: string, body: B, init: ApiRequestInit = {}) {
  return apiRequest<T>(path, {
    ...init,
    method: "POST",
    body: JSON.stringify(body)
  });
}
