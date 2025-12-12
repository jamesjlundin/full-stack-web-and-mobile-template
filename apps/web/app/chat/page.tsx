"use client";

import { streamChat } from "@acme/api-client";
import { useState } from "react";

import type { FormEvent } from "react";

type Status = "idle" | "streaming" | "done";

export default function ChatPage() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setStatus("streaming");
    setOutput("");
    setError(null);

    try {
      for await (const chunk of streamChat({ prompt })) {
        if (chunk.content) {
          setOutput((prev) => prev + chunk.content);
        }
      }

      setStatus("done");
    } catch (err) {
      setError((err as Error).message);
      setStatus("idle");
    }
  };

  const handleClear = () => {
    setPrompt("");
    setOutput("");
    setStatus("idle");
    setError(null);
  };

  return (
    <main style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h1>Chat Stream Demo</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <label htmlFor="prompt">Prompt</label>
        <textarea
          id="prompt"
          name="prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={4}
          style={{ width: "100%" }}
          disabled={status === "streaming"}
        />
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="submit" disabled={status === "streaming" || !prompt.trim()}>
            {status === "streaming" ? "Streaming..." : "Stream"}
          </button>
          <button type="button" onClick={handleClear} disabled={status === "streaming"}>
            Clear
          </button>
        </div>
        <div>Status: {status}</div>
        {error ? <div role="alert">Error: {error}</div> : null}
      </form>
      <section>
        <h2>Output</h2>
        <pre
          aria-live="polite"
          style={{ minHeight: "120px", padding: "0.5rem", border: "1px solid #ccc", whiteSpace: "pre-wrap" }}
        >
          {output}
        </pre>
      </section>
    </main>
  );
}
