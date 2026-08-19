const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://weeave-server.onrender.com";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = Array.isArray(body?.detail)
      ? body.detail.map((item) => item.msg).join(", ")
      : body?.detail;
    throw new Error(detail || `Request failed (${response.status})`);
  }

  return body;
}

export const workflowsApi = {
  list: () => request("/api/workflows"),
  get: (id) => request(`/api/workflows/${id}`),
  create: (workflow) =>
    request("/api/workflows", {
      method: "POST",
      body: JSON.stringify(workflow),
    }),
  update: (id, workflow) =>
    request(`/api/workflows/${id}`, {
      method: "PUT",
      body: JSON.stringify(workflow),
    }),
  remove: (id) => request(`/api/workflows/${id}`, { method: "DELETE" }),
  execute: (id, input) =>
    request(`/api/workflows/${id}/execute`, {
      method: "POST",
      body: JSON.stringify({ input }),
    }),
  runs: (id) => request(`/api/workflows/${id}/runs`),
  runDetail: (id) => request(`/api/workflows/runs/${id}`),
};
