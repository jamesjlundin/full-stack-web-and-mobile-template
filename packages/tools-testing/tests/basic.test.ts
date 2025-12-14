/**
 * Basic tests for @acme/tools registry and MCP adapter.
 */

import {
  invokeTool,
  listTools,
  clearRegistry,
  toMcpEndpoints,
  hasTool,
} from "@acme/tools";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";

import { registerTestTools } from "../src/register";

describe("Tool Registry", () => {
  beforeEach(() => {
    // Clear and re-register tools before each test
    clearRegistry();
    registerTestTools();
  });

  describe("registerTestTools", () => {
    it("should register echo and math.add tools", () => {
      expect(hasTool("echo")).toBe(true);
      expect(hasTool("math.add")).toBe(true);
    });

    it("should list registered tools", () => {
      const tools = listTools();
      expect(tools).toHaveLength(2);

      const names = tools.map((t) => t.name);
      expect(names).toContain("echo");
      expect(names).toContain("math.add");
    });
  });

  describe("echo tool", () => {
    it("should echo text as-is", async () => {
      const result = await invokeTool("echo", { text: "hello" });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result).toEqual({ text: "hello" });
      }
    });

    it("should transform to uppercase", async () => {
      const result = await invokeTool("echo", {
        text: "hello",
        transform: "uppercase",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result).toEqual({ text: "HELLO" });
      }
    });

    it("should transform to lowercase", async () => {
      const result = await invokeTool("echo", {
        text: "HELLO",
        transform: "lowercase",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result).toEqual({ text: "hello" });
      }
    });

    it("should reverse text", async () => {
      const result = await invokeTool("echo", {
        text: "hello",
        transform: "reverse",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result).toEqual({ text: "olleh" });
      }
    });

    it("should fail validation for missing text field", async () => {
      const result = await invokeTool("echo", {});

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Input validation failed");
        expect(result.validationErrors).toBeDefined();
        expect(result.validationErrors!.length).toBeGreaterThan(0);
      }
    });

    it("should fail validation for invalid transform", async () => {
      const result = await invokeTool("echo", {
        text: "hello",
        transform: "invalid",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Input validation failed");
      }
    });
  });

  describe("math.add tool", () => {
    it("should add two positive numbers", async () => {
      const result = await invokeTool("math.add", { a: 5, b: 3 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result).toEqual({ sum: 8 });
      }
    });

    it("should add negative numbers", async () => {
      const result = await invokeTool("math.add", { a: -5, b: -3 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result).toEqual({ sum: -8 });
      }
    });

    it("should handle zero", async () => {
      const result = await invokeTool("math.add", { a: 0, b: 0 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result).toEqual({ sum: 0 });
      }
    });

    it("should handle floating point numbers", async () => {
      const result = await invokeTool("math.add", { a: 1.5, b: 2.5 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result).toEqual({ sum: 4 });
      }
    });

    it("should fail validation for non-numeric input", async () => {
      const result = await invokeTool("math.add", { a: "five", b: 3 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Input validation failed");
        expect(result.validationErrors).toBeDefined();
      }
    });

    it("should fail validation for missing fields", async () => {
      const result = await invokeTool("math.add", { a: 5 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Input validation failed");
      }
    });
  });

  describe("unknown tools", () => {
    it("should return error for unknown tool", async () => {
      const result = await invokeTool("unknown.tool", { foo: "bar" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Tool "unknown.tool" not found');
      }
    });
  });
});

describe("MCP Adapter", () => {
  beforeAll(() => {
    clearRegistry();
    registerTestTools();
  });

  describe("list_tools", () => {
    it("should return tool metadata with schemas", () => {
      const mcp = toMcpEndpoints();
      const tools = mcp.list_tools();

      expect(tools).toHaveLength(2);

      const echoTool = tools.find((t) => t.name === "echo");
      expect(echoTool).toBeDefined();
      expect(echoTool!.description).toBe(
        "Echo input text back, optionally transforming it"
      );
      expect(echoTool!.input_schema).toHaveProperty("type", "object");
      expect(echoTool!.input_schema).toHaveProperty("properties");

      const mathTool = tools.find((t) => t.name === "math.add");
      expect(mathTool).toBeDefined();
      expect(mathTool!.description).toBe("Add two numbers together");
    });
  });

  describe("call_tool", () => {
    it("should call echo tool successfully", async () => {
      const mcp = toMcpEndpoints();
      const result = await mcp.call_tool("echo", { text: "test" });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result).toEqual({ text: "test" });
      }
    });

    it("should call math.add tool successfully", async () => {
      const mcp = toMcpEndpoints();
      const result = await mcp.call_tool("math.add", { a: 10, b: 20 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result).toEqual({ sum: 30 });
      }
    });

    it("should return validation errors", async () => {
      const mcp = toMcpEndpoints();
      const result = await mcp.call_tool("math.add", { a: "invalid", b: 5 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Input validation failed");
        expect(result.validation_errors).toBeDefined();
        expect(result.validation_errors!.length).toBeGreaterThan(0);
      }
    });

    it("should return error for unknown tool", async () => {
      const mcp = toMcpEndpoints();
      const result = await mcp.call_tool("nonexistent", { foo: "bar" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Tool "nonexistent" not found');
      }
    });
  });
});
