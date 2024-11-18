import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ["react", "react-dom", "axios"],
                },
            },
        },
    },
    // server: {
    //     proxy: {
    //         "/api": {
    //             target: `${import.meta.env.VITE_BACKEND_URL}`,
    //             changeOrigin: true,
    //             secure: false,
    //         },
    //     },
    // },
});
