import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), {
    name: "privacy-page-route",
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (["/guides/wheel-picker", "/guides/wheel-picker/"].includes(request.url?.split("?")[0] || "")) {
          request.url = request.url!.replace(/^\/guides\/wheel-picker\/?/, "/guides/wheel-picker/index.html");
        }
        if (request.url?.split("?")[0] === "/privacy" || request.url?.split("?")[0] === "/privacy/") {
          request.url = request.url.replace(/^\/privacy\/?/, "/privacy/index.html");
        }
        next();
      });
    },
  }],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/v1": {
        target: "http://127.0.0.1:2001",
        changeOrigin: true,
      },
    },
  },
});
