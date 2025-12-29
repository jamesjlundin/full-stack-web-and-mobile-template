/**
 * Schema Fidelity Suite
 *
 * Evaluates whether model outputs conform to specified JSON schemas.
 * Metric: % of responses that are valid JSON matching the schema.
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import type { Suite, EvalContext } from './types.js';
import type { SchemaFixture } from '../fixtures/types.js';
import type { CaseResult } from '../reporters/types.js';

// Create Ajv instance with formats
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AjvClass = (Ajv as any).default ?? Ajv;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addFormatsFunc = (addFormats as any).default ?? addFormats;

const ajv = new AjvClass({ allErrors: true, strict: false });
addFormatsFunc(ajv);

export const schemaFidelitySuite: Suite = {
  name: 'Schema Fidelity',
  description: 'Evaluates JSON schema compliance of model outputs',
  metricName: 'schema_fidelity',

  async run(context: EvalContext): Promise<CaseResult[]> {
    const schemaFixtures = context.fixtures.filter(
      (f): f is SchemaFixture => f.category === 'schema',
    );

    const results: CaseResult[] = [];
    const limit = context.limit ?? schemaFixtures.length;

    for (let i = 0; i < Math.min(limit, schemaFixtures.length); i++) {
      const fixture = schemaFixtures[i];
      const result = await evaluateSchemaCase(context, fixture);
      results.push(result);
    }

    return results;
  },
};

async function evaluateSchemaCase(
  context: EvalContext,
  fixture: SchemaFixture,
): Promise<CaseResult> {
  try {
    // Build a prompt that includes the schema so the model knows the exact structure
    const schemaDescription = JSON.stringify(fixture.schema, null, 2);
    const promptWithSchema = `${fixture.prompt}

The response must be a JSON object that conforms to this JSON schema:
${schemaDescription}

Generate a valid JSON object matching this schema.`;

    const response = await context.model.generate(
      [
        {
          role: 'system',
          content:
            'You are a helpful assistant that generates valid JSON. Always respond with valid JSON only, no additional text. Ensure the JSON matches the provided schema exactly.',
        },
        { role: 'user', content: promptWithSchema },
      ],
      { responseFormat: 'json' },
    );

    // Try to parse the response as JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(response.content);
    } catch {
      return {
        id: fixture.id,
        suite: 'schema_fidelity',
        name: fixture.name,
        passed: false,
        score: 0,
        error: 'Response is not valid JSON',
        details: `Response: ${response.content.substring(0, 200)}`,
      };
    }

    // Validate against schema
    const validate = ajv.compile(fixture.schema);
    const valid = validate(parsed);

    if (!valid) {
      const errors = validate.errors
        ?.map((e: { instancePath: string; message?: string }) => `${e.instancePath} ${e.message}`)
        .join('; ');

      return {
        id: fixture.id,
        suite: 'schema_fidelity',
        name: fixture.name,
        passed: false,
        score: 0,
        error: 'Schema validation failed',
        details: errors,
      };
    }

    // Check required fields if specified
    if (fixture.requiredFields) {
      const obj = parsed as Record<string, unknown>;
      const missingFields = fixture.requiredFields.filter((field) => !(field in obj));

      if (missingFields.length > 0) {
        return {
          id: fixture.id,
          suite: 'schema_fidelity',
          name: fixture.name,
          passed: false,
          score: 0,
          error: `Missing required fields: ${missingFields.join(', ')}`,
        };
      }
    }

    return {
      id: fixture.id,
      suite: 'schema_fidelity',
      name: fixture.name,
      passed: true,
      score: 1,
    };
  } catch (error) {
    return {
      id: fixture.id,
      suite: 'schema_fidelity',
      name: fixture.name,
      passed: false,
      score: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default schemaFidelitySuite;
