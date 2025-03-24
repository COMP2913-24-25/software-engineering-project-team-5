import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import compression from "vite-plugin-compression";
import viteImagemin from "vite-plugin-imagemin";

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        viteImagemin({
            mozjpeg: { quality: 80 },
            pngquant: { quality: [0.6, 0.8] },
        }),
        compression({ algorithm: "brotliCompress" }),
    ],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: "./src/tests/setup.js",
    },
    build: {
        outDir: "dist", // Output directory for the build
        emptyOutDir: true, // Clear the output directory before building
        rollupOptions: {
            input: resolve(__dirname, "index.html"), // Single entry point for SPA
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules")) {
                        return id.split("node_modules/")[1].split("/")[0];
                    }
                },
            },
        },
    },
});
