import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    // tests/db usa su propio corredor (npm run test:db).
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
