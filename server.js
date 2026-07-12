const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { URL } = require("url");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4192);

const routes = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/services", "services.html"],
  ["/services.html", "services.html"],
  ["/projects", "projects.html"],
  ["/projects.html", "projects.html"],
  ["/process", "process.html"],
  ["/process.html", "process.html"],
  ["/contact", "contact.html"],
  ["/contact.html", "contact.html"],
  ["/robots.txt", "robots.txt"],
  ["/sitemap.xml", "sitemap.xml"]
]);

const securityHeaders = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
    "form-action 'self'",
    "connect-src 'self'",
    "upgrade-insecure-requests"
  ].join("; "),
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN"
};

function mimeType(filePath) {
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".xml": "application/xml; charset=utf-8"
  }[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function send(response, request, status, headers, body) {
  let payload = Buffer.isBuffer(body) ? body : Buffer.from(String(body), "utf8");
  const type = headers["Content-Type"] || "";
  const accepts = String(request.headers["accept-encoding"] || "");
  const compressible = type.startsWith("text/") || type.includes("javascript") || type.includes("xml");

  if (request.method !== "HEAD" && payload.length > 1024 && compressible && accepts.includes("gzip")) {
    payload = zlib.gzipSync(payload);
    headers["Content-Encoding"] = "gzip";
    headers.Vary = "Accept-Encoding";
  }

  response.writeHead(status, {
    ...securityHeaders,
    ...headers,
    "Content-Length": String(payload.length)
  });
  response.end(request.method === "HEAD" ? undefined : payload);
}

function serveFile(request, response, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      send(response, request, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not found");
      return;
    }

    const isHtml = filePath.endsWith(".html");
    send(response, request, 200, {
      "Content-Type": mimeType(filePath),
      "Cache-Control": isHtml ? "public, max-age=60, must-revalidate" : "public, max-age=86400"
    }, data);
  });
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(url.pathname);
  const isAsset = pathname.startsWith("/assets/");
  const publicPath = routes.get(pathname) || (isAsset ? pathname.replace(/^\/+/, "") : "");

  if (!publicPath || !["GET", "HEAD"].includes(request.method)) {
    send(response, request, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not found");
    return;
  }

  const filePath = path.normalize(path.join(ROOT, publicPath));
  const assetsRoot = path.join(ROOT, "assets");
  if (!filePath.startsWith(ROOT) || (isAsset && !filePath.startsWith(assetsRoot))) {
    send(response, request, 403, { "Content-Type": "text/plain; charset=utf-8" }, "Forbidden");
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveFile(request, response, filePath);
    return;
  }

  send(response, request, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not found");
});

server.listen(PORT, () => {
  console.log(`RS BuildPro Ltd website running on http://127.0.0.1:${PORT}`);
});
