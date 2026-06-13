const DEFAULT_BACKEND_URL = "https://eva-360-production.up.railway.app";

function backendUrl(env) {
  return (env.BACKEND_URL || env.VITE_API_URL || DEFAULT_BACKEND_URL).replace(/\/$/, "");
}

function proxiedUrl(request, env) {
  const incoming = new URL(request.url);
  const path = incoming.pathname.replace(/^\/api(?=\/|$)/, "") || "/";
  return `${backendUrl(env)}${path}${incoming.search}`;
}

function proxyHeaders(request) {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("cf-connecting-ip");
  headers.delete("cf-ipcountry");
  headers.delete("cf-ray");
  headers.delete("cf-visitor");
  headers.delete("x-forwarded-proto");
  return headers;
}

function stripInvalidCookieDomain(responseHeaders, frontendHost) {
  const getSetCookie = responseHeaders.getSetCookie?.bind(responseHeaders);
  const cookies = getSetCookie ? getSetCookie() : [];
  if (cookies.length === 0) return;

  responseHeaders.delete("set-cookie");
  for (const cookie of cookies) {
    const cookieForCurrentHost = cookie.replace(
      /;\s*Domain=([^;]+)/i,
      (_match, domain) => {
        const normalized = String(domain).replace(/^\./, "").toLowerCase();
        const host = frontendHost.toLowerCase();
        return host === normalized || host.endsWith(`.${normalized}`) ? `; Domain=${domain}` : "";
      }
    );
    responseHeaders.append("set-cookie", cookieForCurrentHost);
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  const target = proxiedUrl(request, env);
  const init = {
    method: request.method,
    headers: proxyHeaders(request),
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    redirect: "manual",
  };

  const backendResponse = await fetch(target, init);
  const headers = new Headers(backendResponse.headers);
  stripInvalidCookieDomain(headers, new URL(request.url).hostname);
  headers.delete("access-control-allow-origin");
  headers.delete("access-control-allow-credentials");

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers,
  });
}
