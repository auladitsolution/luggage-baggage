/**
 * Universal authenticated fetch utility for client-side API requests.
 * Automatically attaches:
 * 1. credentials: "include" (ensures HttpOnly session cookies are transmitted across domains/proxies)
 * 2. Authorization: Bearer <token> (backup header if cookie is blocked or cross-origin)
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("lumina_auth_token");
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      localStorage.setItem("lumina_auth_token", token);
    } else {
      localStorage.removeItem("lumina_auth_token");
    }
  } catch {}
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("lumina_auth_token");
  } catch {}
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const options: RequestInit = {
    ...init,
    credentials: init?.credentials || "include",
  };

  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  options.headers = headers;

  return fetch(input, options);
}

