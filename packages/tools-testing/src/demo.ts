/**
 * Demo script to showcase tool registry and MCP adapter functionality.
 * Run with: node packages/tools-testing/dist/demo.js
 */

import { listTools, invokeTool, toMcpEndpoints } from "@acme/tools";

import { registerTestTools } from "./register.js";

async function main(): Promise<void> {
  console.log("=== Tool Registry Demo ===\n");

  // Ensure test tools are registered
  registerTestTools();

  // 1. List tools via registry
  console.log("1. Registered tools:");
  const tools = listTools();
  for (const tool of tools) {
    console.log(`   - ${tool.name}: ${tool.description || "(no description)"}`);
  }
  console.log();

  // 2. List tools via MCP adapter
  console.log("2. Tools via MCP adapter (list_tools):");
  const mcp = toMcpEndpoints();
  const mcpTools = mcp.list_tools();
  for (const tool of mcpTools) {
    console.log(`   - ${tool.name}:`);
    console.log(`     description: ${tool.description || "(none)"}`);
    console.log(`     input_schema: ${JSON.stringify(tool.input_schema)}`);
  }
  console.log();

  // 3. Invoke tools via registry
  console.log("3. Invoke tools via registry (invokeTool):");

  // Echo tool - basic
  const echoResult = await invokeTool("echo", { text: "Hello, World!" });
  console.log(`   echo({ text: "Hello, World!" }):`);
  console.log(`     ${JSON.stringify(echoResult)}`);

  // Echo tool - with transform
  const echoUpperResult = await invokeTool("echo", {
    text: "hello",
    transform: "uppercase",
  });
  console.log(`   echo({ text: "hello", transform: "uppercase" }):`);
  console.log(`     ${JSON.stringify(echoUpperResult)}`);

  // Math.add tool
  const addResult = await invokeTool("math.add", { a: 5, b: 3 });
  console.log(`   math.add({ a: 5, b: 3 }):`);
  console.log(`     ${JSON.stringify(addResult)}`);
  console.log();

  // 4. Invoke tools via MCP adapter
  console.log("4. Invoke tools via MCP adapter (call_tool):");

  const mcpEchoResult = await mcp.call_tool("echo", { text: "MCP test" });
  console.log(`   call_tool("echo", { text: "MCP test" }):`);
  console.log(`     ${JSON.stringify(mcpEchoResult)}`);

  const mcpAddResult = await mcp.call_tool("math.add", { a: 10, b: 20 });
  console.log(`   call_tool("math.add", { a: 10, b: 20 }):`);
  console.log(`     ${JSON.stringify(mcpAddResult)}`);
  console.log();

  // 5. Validation error example
  console.log("5. Validation error example:");

  const invalidResult = await invokeTool("math.add", { a: "not a number", b: 5 });
  console.log(`   math.add({ a: "not a number", b: 5 }):`);
  console.log(`     ${JSON.stringify(invalidResult, null, 2)}`);
  console.log();

  // 6. Unknown tool example
  console.log("6. Unknown tool example:");

  const unknownResult = await invokeTool("unknown.tool", { foo: "bar" });
  console.log(`   unknown.tool({ foo: "bar" }):`);
  console.log(`     ${JSON.stringify(unknownResult)}`);
  console.log();

  console.log("=== Demo Complete ===");
}

main().catch(console.error);
