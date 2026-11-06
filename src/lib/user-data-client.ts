export async function userData<T>(resource: string, options?: { method: string; body?: unknown; signal?: AbortSignal }): Promise<T> {
  const response = await fetch(`/api/user-data?${resource}`, {
    method: options?.method ?? 'GET', credentials: 'same-origin', cache: 'no-store',
    headers: options?.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: options?.body === undefined ? undefined : JSON.stringify(options.body), signal: options?.signal,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'Could not access saved data.');
  return data as T;
}
