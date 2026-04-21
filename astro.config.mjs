// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from "vite";

// https://astro.build/config
// Dev: browser calls same-origin /api/authgravity/* → Vite proxies to AuthGravity (avoids CORS on localhost).
export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = (
    env.AUTHGRAVITY_PROXY_TARGET ||
    env.PUBLIC_AUTHGRAVITY_URL ||
    ""
  )
    .trim()
    .replace(/\/$/, "");

  return {
    devToolbar: {
      enabled: false,
    },
    vite: {
      server: {
        proxy: proxyTarget
          ? {
              "/api/authgravity": {
                target: proxyTarget,
                changeOrigin: true,
                secure: true,
                rewrite: (path) => path.replace(/^\/api\/authgravity/, "") || "/",
              },
            }
          : {},
      },
    },
  };
});
