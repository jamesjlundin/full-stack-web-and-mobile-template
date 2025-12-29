import { createApiClient } from "../src";

process.stdout.on("error", (error) => {
  if ((error as NodeJS.ErrnoException).code === "EPIPE") {
    process.exit(0);
  }

  throw error;
});

const baseUrl = process.env.API_BASE_URL ?? "http://localhost:3000";
const apiClient = createApiClient({ baseUrl });

async function main() {
  console.log(`Checking health at ${baseUrl}/api/health`);
  const healthResponse = await fetch(`${baseUrl}/api/health`);
  const health = await healthResponse.json().catch(() => ({ ok: false }));
  console.log("Health response:", health);

  console.log("\nStreaming sample response:\n");
  let chunkCount = 0;

  for await (const chunk of apiClient.streamChat({
    prompt: "Quick smoke test",
  })) {
    process.stdout.write(chunk.content);
    chunkCount += 1;

    if (chunkCount >= 6) {
      break;
    }
  }

  console.log("\n\nSmoke test complete.");
}

main().catch((error) => {
  console.error("Smoke test failed", error);
  process.exit(1);
});
