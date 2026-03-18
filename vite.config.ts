import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

function stripSecurityHeaders(proxy: import("http-proxy").Server) {
  proxy.on("proxyRes", (proxyRes) => {
    delete proxyRes.headers["x-frame-options"];
    delete proxyRes.headers["content-security-policy"];
  });
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const copilotProxyToken = env.COPILOT_PROXY_TOKEN || env.INTERNAL_API_TOKEN || "";
  const isDev = mode === "development";

  const csp = isDev
    ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' http: https: ws: wss:; media-src 'self' https: blob:; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'"
    : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: wss:; media-src 'self' https: blob:; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests";

  const securityHeaders = {
    "Content-Security-Policy": csp,
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
  };

  return {
    server: {
      host: "127.0.0.1",
      port: 8081,
      headers: securityHeaders,
      hmr: {
        overlay: false,
      },
      allowedHosts: ["tjark-osterloh.de"],
      proxy: {
        "/api": {
          target: "http://localhost:4142/v1",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          headers: copilotProxyToken ? { "x-api-key": copilotProxyToken } : undefined,
          configure: stripSecurityHeaders,
        },
        "/canvas/": {
          target: "http://localhost:4200",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/canvas/, ""),
          configure: stripSecurityHeaders,
        },
        "/browser/": {
          target: "http://localhost:3457",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/browser/, ""),
          configure: stripSecurityHeaders,
        },
        "/integrations/": {
          target: "http://localhost:4300",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/integrations/, ""),
          configure: stripSecurityHeaders,
        },
        "/payments/": {
          target: "http://localhost:4400",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/payments/, ""),
          configure: stripSecurityHeaders,
        },
        "/video/": {
          target: "http://localhost:3456",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/video/, ""),
          configure: stripSecurityHeaders,
        },
      },
    },
    preview: {
      host: "127.0.0.1",
      port: 8081,
      strictPort: true,
      headers: securityHeaders,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
