import { expect } from "vitest";

// Small dependency-free assertion for the JSON Schema vocabulary emitted here.
// Unknown keywords are not silently handled as validators; this covers the
// structural/enum/numeric/string vocabulary needed by our HTTP response samples.
export function assertResponse(value, schema, schemas, location = "$", depth = 0) {
  if (depth > 100) throw new Error(`Excessive response nesting: ${location}`);
  if (schema.$ref)
    return assertResponse(
      value,
      schemas[schema.$ref.split("/").at(-1)],
      schemas,
      location,
      depth + 1,
    );
  if (schema.anyOf || schema.oneOf) {
    const matches = (schema.anyOf ?? schema.oneOf).filter((option) => {
      try {
        assertResponse(value, option, schemas, location, depth + 1);
        return true;
      } catch {
        return false;
      }
    });
    expect(matches.length, `${location} union mismatch: ${JSON.stringify(value)}`).toBeGreaterThan(
      0,
    );
    if (schema.oneOf) expect(matches).toHaveLength(1);
    return;
  }
  if (schema.const !== undefined) expect(value, location).toEqual(schema.const);
  if (schema.enum) expect(schema.enum, location).toContain(value);
  if (schema.type) {
    const type = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
    expect(
      allowed.some((item) => item === type || (item === "integer" && Number.isInteger(value))),
      `${location} expected ${allowed}`,
    ).toBe(true);
  }
  if (value === null) return;
  if (typeof value === "object" && !Array.isArray(value)) {
    for (const required of schema.required ?? [])
      expect(value, `${location} required ${required}`).toHaveProperty(required);
    for (const [key, item] of Object.entries(value)) {
      const child = schema.properties?.[key];
      if (child) assertResponse(item, child, schemas, `${location}.${key}`, depth + 1);
      else if (schema.additionalProperties === false)
        throw new Error(`Unexpected response field: ${location}.${key}`);
      else if (typeof schema.additionalProperties === "object")
        assertResponse(item, schema.additionalProperties, schemas, `${location}.${key}`, depth + 1);
    }
  }
  if (Array.isArray(value))
    for (const [index, item] of value.entries())
      assertResponse(item, schema.items, schemas, `${location}[${index}]`, depth + 1);
  if (typeof value === "string") {
    if (schema.pattern) expect(value, location).toMatch(new RegExp(schema.pattern));
    if (schema.maxLength != null)
      expect(value.length, location).toBeLessThanOrEqual(schema.maxLength);
    if (schema.minLength != null)
      expect(value.length, location).toBeGreaterThanOrEqual(schema.minLength);
    if (schema.format === "date-time")
      expect(Number.isFinite(Date.parse(value)), `${location} datetime`).toBe(true);
  }
  if (typeof value === "number") {
    expect(Number.isFinite(value), location).toBe(true);
    if (schema.minimum != null) expect(value, location).toBeGreaterThanOrEqual(schema.minimum);
    if (schema.maximum != null) expect(value, location).toBeLessThanOrEqual(schema.maximum);
  }
}
