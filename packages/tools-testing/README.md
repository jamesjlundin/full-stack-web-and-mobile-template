# @acme/tools-testing

Test fixtures and deterministic mock tools for `@acme/tools`.

## Features

- **Echo Tool**: Returns input text, optionally transformed (uppercase, lowercase, reverse)
- **Math.Add Tool**: Adds two numbers deterministically
- **Auto-Registration**: Tools are registered when module is imported
- **Type Exports**: Full TypeScript types for all tools

## Installation

```bash
pnpm add @acme/tools-testing
```

## Quick Start

### Register Test Tools

```typescript
import "@acme/tools-testing/register";

// Or explicitly:
import { registerTestTools } from "@acme/tools-testing";
registerTestTools();
```

### Use Test Tools

```typescript
import { invokeTool } from "@acme/tools";
import "@acme/tools-testing/register";

// Echo tool
const echo = await invokeTool("echo", { text: "hello" });
// { ok: true, result: { text: "hello" } }

const upper = await invokeTool("echo", { text: "hello", transform: "uppercase" });
// { ok: true, result: { text: "HELLO" } }

// Math.add tool
const sum = await invokeTool("math.add", { a: 5, b: 3 });
// { ok: true, result: { sum: 8 } }
```

## Available Tools

### echo

Echo input text back, optionally transforming it.

**Input:**
- `text` (string, required): Text to echo
- `transform` (optional): One of `"none"`, `"uppercase"`, `"lowercase"`, `"reverse"`

**Output:**
- `text` (string): Echoed/transformed text

### math.add

Add two numbers together.

**Input:**
- `a` (number, required): First number
- `b` (number, required): Second number

**Output:**
- `sum` (number): Sum of a and b

## Running the Demo

```bash
# Build packages first
pnpm -C packages/tools build
pnpm -C packages/tools-testing build

# Run demo
node packages/tools-testing/dist/demo.js
```

## Running Tests

```bash
pnpm -C packages/tools-testing test
```

## Exports

```typescript
// Tool registration
export { registerTestTools } from "@acme/tools-testing";

// Echo tool
export {
  echoContract,
  echoImpl,
  echoInputSchema,
  echoOutputSchema,
} from "@acme/tools-testing";

// Math.add tool
export {
  mathAddContract,
  mathAddImpl,
  mathAddInputSchema,
  mathAddOutputSchema,
} from "@acme/tools-testing";

// Types
export type {
  EchoInput,
  EchoOutput,
  EchoTransform,
  MathAddInput,
  MathAddOutput,
} from "@acme/tools-testing";
```
