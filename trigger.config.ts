import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "proj_ycgesjgvudrqrtzwthmp",
  dirs: ["./trigger"],
  runtime: "node",
  logLevel: "log",
  maxDuration: 600,
  processKeepAlive: true,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  build: {
    autoDetectExternal: true,
    keepNames: true,
    minify: false,
  },
});
