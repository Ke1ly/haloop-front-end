import { defineConfig } from "vite";
import { resolve } from "path";
import { sign } from "crypto";

export default defineConfig(({ mode }) => ({
  appType: "mpa",
  plugins: [
    {
      name: "rewrite-middleware",
      configureServer(serve) {
        serve.middlewares.use((req, res, next) => {
          if (req.url?.startsWith("/workpost/")) {
            req.url = "/workpost";
          }
          next();
        });
      },
    },
  ],
  server:
    mode === "development"
      ? {
          proxy: {
            "/api": {
              target: "http://localhost:3000",
              changeOrigin: true,
              secure: false,
            },
            "/socket.io": {
              target: "http://localhost:3000",
              ws: true, //表示支援 WebSocket 協議升級
            },
          },
        }
      : undefined,
  build: {
    emptyOutDir: true,
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        account: resolve(__dirname, "account.html"),
        works: resolve(__dirname, "works.html"),
        chat: resolve(__dirname, "chat.html"),
        workpost: resolve(__dirname, "workpost.html"),
        subscription: resolve(__dirname, "subscription.html"),
        signup: resolve(__dirname, "signup.html"),
      },
    },
  },
  define: {
    __API_URL__: JSON.stringify(
      process.env.VITE_API_URL || "http://localhost:3000"
    ),
    __APP_ENV__: JSON.stringify(process.env.NODE_ENV),
  },
}));
