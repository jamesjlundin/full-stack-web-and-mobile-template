/**
 * Fixture types for evaluation test cases
 */

import type { ToolDefinition } from "../models/types.js";

/**
 * Base fixture interface
 */
export interface BaseFixture {
  id: string;
  name: string;
  description: string;
  category:
    | "qa"
    | "summarize"
    | "extract"
    | "plan"
    | "schema"
    | "tool"
    | "grounding";
}

/**
 * QA fixture for question-answering tasks
 */
export interface QAFixture extends BaseFixture {
  category: "qa";
  question: string;
  expectedAnswer?: string;
  acceptablePatterns?: RegExp[];
}

/**
 * Summarization fixture
 */
export interface SummarizeFixture extends BaseFixture {
  category: "summarize";
  content: string;
  maxLength?: number;
  keyPoints?: string[];
}

/**
 * Extraction fixture
 */
export interface ExtractFixture extends BaseFixture {
  category: "extract";
  content: string;
  extractionTarget: string;
  expectedFields?: string[];
}

/**
 * Planning fixture
 */
export interface PlanFixture extends BaseFixture {
  category: "plan";
  task: string;
  constraints?: string[];
  expectedSteps?: number;
}

/**
 * Schema fixture for testing JSON schema compliance
 */
export interface SchemaFixture extends BaseFixture {
  category: "schema";
  prompt: string;
  schema: Record<string, unknown>;
  requiredFields?: string[];
  isTrap?: boolean; // Schema trap cases
}

/**
 * Tool usage fixture
 */
export interface ToolFixture extends BaseFixture {
  category: "tool";
  prompt: string;
  tools: ToolDefinition[];
  expectedTool: string;
  expectedArguments?: Record<string, unknown>;
}

/**
 * Grounding fixture for context-based responses
 */
export interface GroundingFixture extends BaseFixture {
  category: "grounding";
  context: string;
  question: string;
  expectedFacts: string[];
}

/**
 * Union type for all fixture types
 */
export type Fixture =
  | QAFixture
  | SummarizeFixture
  | ExtractFixture
  | PlanFixture
  | SchemaFixture
  | ToolFixture
  | GroundingFixture;
