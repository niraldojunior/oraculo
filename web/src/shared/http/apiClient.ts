type QueryValue = string | number | boolean | null | undefined;

function withQuery(path: string, query?: Record<string, QueryValue>) {
  if (!query) return path;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined) continue;
    params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `${path}?${serialized}` : path;
}

async function extractErrorMessage(response: Response, defaultMsg: string): Promise<string> {
  try {
    const body = await response.json();
    if (body?.error) return body.error;
    if (body?.message) return body.message;
  } catch {}
  return defaultMsg;
}

export async function getJson<T>(path: string, query?: Record<string, QueryValue>): Promise<T> {
  const response = await fetch(withQuery(path, query), { cache: 'no-store' });
  if (!response.ok) {
    const message = await extractErrorMessage(response, `GET ${path} failed with status ${response.status}`);
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response, `POST ${path} failed with status ${response.status}`);
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
