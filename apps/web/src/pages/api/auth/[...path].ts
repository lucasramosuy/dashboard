import type { APIRoute } from "astro";

const UPSTREAM_BASE =
  (import.meta.env.INTERNAL_API_BASE as string | undefined) ??
  (import.meta.env.PUBLIC_API_BASE as string | undefined) ??
  "https://api.lucasramos.uy/api";

// Strip trailing /api suffix to get the auth base URL
// Better Auth mounts at /api/auth, so upstream is <base>/auth/[...path]
const AUTH_UPSTREAM = UPSTREAM_BASE.replace(/\/api$/, "");

export const ALL: APIRoute = async ({ request, params }) => {
  const path = (params as Record<string, string>)["path"] ?? "";
  const upstreamUrl = `${AUTH_UPSTREAM}/api/auth/${path}${
    new URL(request.url).search
  }`;

  // Forward ALL headers from the browser request so Cloudflare sees a real browser
  const forwardHeaders = new Headers(request.headers);
  // Remove hop-by-hop headers that shouldn't be forwarded
  forwardHeaders.delete("host");
  forwardHeaders.delete("connection");
  forwardHeaders.delete("transfer-encoding");

  let body: ArrayBuffer | null = null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.arrayBuffer();
  }

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers: forwardHeaders,
    body,
    redirect: "manual",
  });

  // Rewrite Set-Cookie headers: change Domain to dashboard.lucasramos.uy and SameSite=Lax
  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      // Rewrite domain and SameSite so cookie is stored same-origin
      let rewritten = value
        .replace(/Domain=[^;]+;?/gi, "Domain=dashboard.lucasramos.uy;")
        .replace(/SameSite=\w+/gi, "SameSite=Lax")
        .replace(/;\s*Secure/gi, ""); // Remove Secure flag (not needed for same-origin in some browsers)
      responseHeaders.append("set-cookie", rewritten);
    } else {
      responseHeaders.append(key, value);
    }
  });

  const responseBody =
    upstream.status === 204 || upstream.status === 304
      ? null
      : await upstream.arrayBuffer();

  return new Response(responseBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
};
