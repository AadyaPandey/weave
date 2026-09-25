import toast from "react-hot-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://weave-server-1l60.onrender.com";

const PING_URL = `${API_BASE_URL}/health`;

let serverReadyPromise = null;

/**
 * Wake up / verify the backend before making an API request.
 * If multiple requests happen at the same time, they share the
 * same health-check request.
 */
async function waitForServer() {
  if (serverReadyPromise) {
    return serverReadyPromise;
  }

  serverReadyPromise = (async () => {
    const toastId = toast.loading("Waking up server...");

    try {
      const response = await fetch(PING_URL, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      toast.success("Server is ready!", {
        id: toastId,
      });

      return true;
    } catch (error) {
      toast.error("Server is unavailable. Please try again.", {
        id: toastId,
      });

      console.error("Server health check failed:", error);

      throw error;
    } finally {
      serverReadyPromise = null;
    }
  })();

  return serverReadyPromise;
}

/**
 * Generic API request helper.
 * ALWAYS checks the backend before making the actual request.
 */
async function request(path, options = {}) {
  await waitForServer();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
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

  remove: (id) =>
    request(`/api/workflows/${id}`, {
      method: "DELETE",
    }),

  execute: (id, input) =>
    request(`/api/workflows/${id}/execute`, {
      method: "POST",
      body: JSON.stringify({ input }),
    }),

  runs: (id) => request(`/api/workflows/${id}/runs`),

  runDetail: (id) => request(`/api/workflows/runs/${id}`),
};
