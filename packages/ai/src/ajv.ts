import Ajv from "ajv";
import addFormats from "ajv-formats";

import { schemas, type SchemaKey, type SchemaInfo } from "./schemas/index";

export type ValidatorResult<T> =
  | { valid: true; data: T }
  | { valid: false; errors: string[] };

export interface SchemaValidator<T = unknown> {
  schemaInfo: SchemaInfo;
  validate: (data: unknown) => ValidatorResult<T>;
}

export interface AjvConfig {
  validators: Record<SchemaKey, SchemaValidator>;
  getValidator: <T = unknown>(key: SchemaKey) => SchemaValidator<T>;
}

/**
 * Configures Ajv with formats and compiles all registered schemas.
 * Returns typed validators for each schema.
 *
 * Usage:
 *   const ajv = configureAjv();
 *   const result = ajv.getValidator('chatResponse').validate(data);
 *   if (result.valid) {
 *     console.log(result.data);
 *   } else {
 *     console.error(result.errors);
 *   }
 */
export function configureAjv(): AjvConfig {
  const ajv = new Ajv({
    allErrors: true,
    strict: true,
    strictSchema: true,
    strictNumbers: true,
    strictTypes: true,
    strictTuples: true,
    strictRequired: true,
  });

  // Add standard formats (uri, email, date-time, etc.)
  addFormats(ajv);

  // Compile all schemas and create validators
  const validators = {} as Record<SchemaKey, SchemaValidator>;

  for (const [key, schemaInfo] of Object.entries(schemas)) {
    const compiledValidator = ajv.compile(schemaInfo.schema);

    validators[key as SchemaKey] = {
      schemaInfo,
      validate: (data: unknown): ValidatorResult<unknown> => {
        const valid = compiledValidator(data);
        if (valid) {
          return { valid: true, data };
        }
        const errors = (compiledValidator.errors ?? []).map(
          (err) =>
            `${err.instancePath || "/"}: ${err.message ?? "validation error"}`,
        );
        return { valid: false, errors };
      },
    };
  }

  return {
    validators,
    getValidator: <T = unknown>(key: SchemaKey): SchemaValidator<T> => {
      return validators[key] as SchemaValidator<T>;
    },
  };
}
