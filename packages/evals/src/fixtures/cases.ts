/**
 * Test case fixtures for evaluation
 *
 * Contains ~10 cases across different categories:
 * - QA (question-answering)
 * - Summarization
 * - Extraction
 * - Planning
 * - Schema compliance (including trap cases)
 * - Tool usage
 * - Grounding
 */

import type { Fixture } from './types.js';

export const fixtures: Fixture[] = [
  // QA Cases
  {
    id: 'qa-001',
    name: 'Capital City Question',
    description: 'Simple factual question about geography',
    category: 'qa',
    question: 'What is the capital of France?',
    expectedAnswer: 'Paris',
    acceptablePatterns: [/paris/i, /capital.*france.*paris/i],
  },
  {
    id: 'qa-002',
    name: 'Definition Question',
    description: 'Request for a definition or explanation',
    category: 'qa',
    question: 'What is machine learning?',
    acceptablePatterns: [/machine\s*learning/i, /algorithm/i, /data/i, /pattern/i],
  },

  // Summarization Cases
  {
    id: 'sum-001',
    name: 'Article Summary',
    description: 'Summarize a short article',
    category: 'summarize',
    content: `The rapid advancement of artificial intelligence has transformed numerous industries.
    From healthcare to finance, AI-powered solutions are automating complex tasks, improving
    decision-making, and creating new opportunities for innovation. However, these developments
    also raise important questions about ethics, job displacement, and the need for regulation.`,
    maxLength: 250, // Reasonable length for a summary (actual limit is 2x = 500 chars)
    keyPoints: ['AI', 'industries', 'automation', 'ethics'],
  },

  // Extraction Cases
  {
    id: 'ext-001',
    name: 'Contact Information Extraction',
    description: 'Extract contact details from text',
    category: 'extract',
    content: `Please contact John Smith at john.smith@example.com or call (555) 123-4567
    for more information about our services. Our office is located at 123 Main Street,
    San Francisco, CA 94102.`,
    extractionTarget: 'contact information',
    expectedFields: ['name', 'email', 'phone', 'address'],
  },

  // Planning Cases
  {
    id: 'plan-001',
    name: 'Project Planning',
    description: 'Create steps for a software project',
    category: 'plan',
    task: 'Create a plan to implement a user authentication system',
    constraints: ['Must use secure password hashing', 'Include email verification'],
    expectedSteps: 5,
  },

  // Schema Cases
  {
    id: 'schema-001',
    name: 'User Profile Schema',
    description: 'Generate JSON matching user profile schema',
    category: 'schema',
    prompt: 'Generate a user profile with name, email, and age',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        age: { type: 'number', minimum: 0 },
      },
      required: ['name', 'email', 'age'],
      additionalProperties: true,
    },
    requiredFields: ['name', 'email', 'age'],
  },
  {
    id: 'schema-002',
    name: 'Product Schema',
    description: 'Generate JSON matching product schema',
    category: 'schema',
    prompt: 'Generate a product listing with id, name, price, and inStock status',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        price: { type: 'number', minimum: 0 },
        inStock: { type: 'boolean' },
      },
      required: ['id', 'name', 'price', 'inStock'],
      additionalProperties: true,
    },
    requiredFields: ['id', 'name', 'price', 'inStock'],
  },

  // Schema Trap Cases (designed to catch common errors)
  {
    id: 'schema-trap-001',
    name: 'Nested Object Trap',
    description: 'Schema with nested required objects - common failure point',
    category: 'schema',
    prompt: 'Generate an event with a nested address object containing street, city, and zip',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        date: { type: 'string' },
        location: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            zip: { type: 'string' },
          },
          required: ['street', 'city', 'zip'],
        },
      },
      required: ['title', 'date', 'location'],
      additionalProperties: true,
    },
    requiredFields: ['title', 'date', 'location'],
    isTrap: true,
  },
  {
    id: 'schema-trap-002',
    name: 'Array Type Trap',
    description: 'Schema requiring array field - tests array generation',
    category: 'schema',
    prompt: 'Generate a meeting with title, time, and an array of attendee emails',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        time: { type: 'string' },
        attendees: {
          type: 'array',
          items: { type: 'string', format: 'email' },
          minItems: 1,
        },
      },
      required: ['title', 'time', 'attendees'],
      additionalProperties: true,
    },
    requiredFields: ['title', 'time', 'attendees'],
    isTrap: true,
  },

  // Tool Usage Cases
  {
    id: 'tool-001',
    name: 'Weather Tool Call',
    description: 'Should invoke weather tool with correct arguments',
    category: 'tool',
    prompt: 'What is the weather in San Francisco?',
    tools: [
      {
        name: 'get_weather',
        description: 'Get current weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'City name' },
            unit: {
              type: 'string',
              enum: ['celsius', 'fahrenheit'],
              description: 'Temperature unit',
            },
          },
          required: ['location'],
        },
      },
    ],
    expectedTool: 'get_weather',
    expectedArguments: { location: 'San Francisco' },
  },

  // Grounding Cases
  {
    id: 'ground-001',
    name: 'Context-Based Answer',
    description: 'Answer should be grounded in provided context',
    category: 'grounding',
    context: `The Acme Corporation was founded in 1985 by Jane Doe in Seattle, Washington.
    The company initially focused on manufacturing industrial equipment but later pivoted
    to software development in 2005. Today, Acme employs over 5,000 people worldwide.`,
    question: 'When and where was Acme Corporation founded, and by whom?',
    expectedFacts: ['1985', 'Jane Doe', 'Seattle'],
  },
];

/**
 * Get fixtures by category
 */
export function getFixturesByCategory(category: Fixture['category']): Fixture[] {
  return fixtures.filter((f) => f.category === category);
}

/**
 * Get a fixture by ID
 */
export function getFixtureById(id: string): Fixture | undefined {
  return fixtures.find((f) => f.id === id);
}

/**
 * Get all fixtures
 */
export function getAllFixtures(): Fixture[] {
  return fixtures;
}
