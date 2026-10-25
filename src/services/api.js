const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/$/, "");

export async function apiRequest(path, options = {}) {
  const { headers = {}, ...requestOptions } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    ...requestOptions,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  });
  const body = await response.text();
  let data;

  try {
    data = body ? JSON.parse(body) : null;
  } catch {
    data = body;
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        body ||
        `Request failed (${response.status})`,
    );
  }

  return data;
}

export async function apiStreamRequest(path, options = {}, onEvent = () => {}) {
  const { headers = {}, ...requestOptions } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    ...requestOptions,
    headers: {
      Accept: "application/x-ndjson",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    let data;
    try { data = body ? JSON.parse(body) : null; } catch { data = null; }
    throw new Error(data?.error || data?.message || body || `Request failed (${response.status})`);
  }

  if (!response.body) throw new Error("This browser does not support streamed responses");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result = null;
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line);
      onEvent(event);
      if (event.type === "complete") result = event;
      if (event.type === "error") throw new Error(event.error || "Metadata refresh failed");
    }
    if (done) break;
  }
  if (buffer.trim()) {
    const event = JSON.parse(buffer);
    onEvent(event);
    if (event.type === "complete") result = event;
    if (event.type === "error") throw new Error(event.error || "Metadata refresh failed");
  }
  if (!result) throw new Error("Metadata refresh ended before completion");
  return result;
}
