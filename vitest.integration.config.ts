import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/integration/**/*.test.{ts,tsx}"],
    // No incluimos setup.ts porque queremos conectarnos a la DB real de Postgres
    setupFiles: ["./__tests__/setup-ui.ts"],
    testTimeout: 60000, // Timeout más alto para los tests reales de DB
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
