import http from 'node:http';
import { readFileSync } from 'node:fs';

function readAppVersion() {
  try {
    const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
    return pkg.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

const appVersion = readAppVersion();

/**
 * Production entrypoint for standalone use and the Home Assistant add-on.
 *
 * adapter-node reads these environment variables when its handler is imported,
 * so they must be set before the dynamic import below. PROTOCOL_HEADER and
 * HOST_HEADER make SvelteKit derive the request origin from forwarding headers;
 * Home Assistant ingress and reverse proxies set them.
 */
process.env.PROTOCOL_HEADER ||= 'x-forwarded-proto';
process.env.HOST_HEADER ||= 'x-forwarded-host';
process.env.BODY_SIZE_LIMIT ||= '512M';

const { handler } = await import('./build/handler.js');

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT) || 3000;

function firstHeader(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  return String(raw ?? '').split(',')[0].trim();
}

function isFormSubmission(request) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method || '')) return false;
  const contentType = firstHeader(request.headers['content-type']).toLowerCase();
  return (
    contentType.startsWith('application/x-www-form-urlencoded') ||
    contentType.startsWith('multipart/form-data')
  );
}

function hostMatchesOrigin(origin, forwardedHost) {
  try {
    return new URL(`${origin.protocol}//${forwardedHost}`).host === origin.host;
  } catch {
    return false;
  }
}

/**
 * Home Assistant ingress can report the request as http even when the browser
 * reached it over https, because TLS is terminated in front of Home Assistant.
 * SvelteKit builds the request origin from the forwarded headers and rejects
 * form posts when it does not match the browser's Origin ("Cross-site POST
 * form submissions are forbidden").
 *
 * Match the Origin against the forwarded host and the browser's Host header.
 * Some proxies rewrite both to an internal host, so also trust the browser's
 * Sec-Fetch-Site: same-origin signal when the request came through ingress.
 * Browsers set that header themselves; a cross-site form cannot claim it.
 */
function alignForwardedHeadersWithOrigin(request) {
  const originHeader = firstHeader(request.headers.origin);
  const ingressPath = firstHeader(request.headers['x-ingress-path']);
  const fetchSite = firstHeader(request.headers['sec-fetch-site']).toLowerCase();

  if (!originHeader || originHeader === 'null') {
    // Home Assistant renders the ingress panel in a sandboxed iframe, so the
    // browser reports an opaque origin ("Origin: null") on form posts. It still
    // marks same-origin requests, so substitute the forwarded origin.
    if (isFormSubmission(request) && ingressPath && fetchSite === 'same-origin') {
      const proto = firstHeader(request.headers['x-forwarded-proto']);
      const forwardedHost = firstHeader(request.headers['x-forwarded-host']);
      if (proto && forwardedHost) request.headers.origin = `${proto}://${forwardedHost}`;
    }
    return;
  }

  let origin;
  try {
    origin = new URL(originHeader);
  } catch {
    return;
  }

  const forwardedHost = firstHeader(request.headers['x-forwarded-host']);
  const hostHeader = firstHeader(request.headers.host);
  const forwardedMatches =
    Boolean(forwardedHost) && hostMatchesOrigin(origin, forwardedHost);
  const hostMatches = Boolean(hostHeader) && hostMatchesOrigin(origin, hostHeader);
  const trustedIngress = Boolean(ingressPath) && fetchSite === 'same-origin';

  if (!forwardedMatches && !hostMatches && !trustedIngress) return;

  request.headers['x-forwarded-proto'] = origin.protocol.slice(0, -1);
  if (!forwardedMatches) request.headers['x-forwarded-host'] = origin.host;
}

const server = http.createServer((request, response) => {
  if (!request.headers['x-forwarded-proto']) {
    request.headers['x-forwarded-proto'] = request.socket.encrypted ? 'https' : 'http';
  }
  if (!request.headers['x-forwarded-host']) {
    request.headers['x-forwarded-host'] = request.headers.host || `localhost:${port}`;
  }

  alignForwardedHeadersWithOrigin(request);

  // Log every form submission with its response status. If a 403 persists,
  // this shows whether the request reached the app and which headers it saw.
  if (isFormSubmission(request)) {
    response.on('finish', () => {
      console.log(
        `Form ${request.method} ${request.url} -> ${response.statusCode} ` +
          JSON.stringify({
            origin: firstHeader(request.headers.origin) || null,
            host: firstHeader(request.headers.host) || null,
            forwardedHost: firstHeader(request.headers['x-forwarded-host']) || null,
            ingressPath: firstHeader(request.headers['x-ingress-path']) || null,
            fetchSite: firstHeader(request.headers['sec-fetch-site']) || null
          })
      );
    });
  }

  // SvelteKit's CSRF check applies to every multipart/form-data request,
  // including API uploads. Command-line and server-to-server clients do not
  // send Origin, so give API requests the app's own origin. Browser requests
  // that do send a foreign Origin are still rejected.
  if (!request.headers.origin && request.url?.startsWith('/api/')) {
    const proto = firstHeader(request.headers['x-forwarded-proto']);
    const forwardedHost = firstHeader(request.headers['x-forwarded-host']);
    request.headers.origin = `${proto}://${forwardedHost}`;
  }

  handler(request, response);
});

server.listen(port, host, () => {
  console.log(`Home Operations ${appVersion} listening on http://${host}:${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 10_000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
