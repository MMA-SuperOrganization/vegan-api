import mongoose from "mongoose";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { AppError } from "../../src/common/errors/app-error.js";
import { createErrorHandler, normalizeError } from "../../src/common/middlewares/error-handler.js";

const createRes = () => {
  const res = { headersSent: false };
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
};

const logger = { error: vi.fn() };

describe("normalizeError", () => {
  it("keeps AppError as-is", () => {
    const error = AppError.notFound("Nope");
    expect(normalizeError(error)).toBe(error);
  });

  it("maps ZodError to VALIDATION_ERROR", () => {
    const { error } = z.object({ a: z.string() }).safeParse({});
    expect(normalizeError(error)).toMatchObject({ statusCode: 400, code: "VALIDATION_ERROR" });
  });

  it("maps Mongoose ValidationError without leaking the raw error", async () => {
    const Model =
      mongoose.models.ErrorHandlerTest ??
      mongoose.model(
        "ErrorHandlerTest",
        new mongoose.Schema({ name: { type: String, required: true } }),
      );
    const error = await new Model({}).validate().catch((validationError) => validationError);

    const normalized = normalizeError(error);

    expect(normalized).toMatchObject({ statusCode: 400, code: "VALIDATION_ERROR" });
    expect(normalized.details).toEqual([
      { path: "name", code: "required", message: expect.any(String) },
    ]);
  });

  it("maps Mongoose CastError to INVALID_ID", () => {
    const error = new mongoose.Error.CastError("ObjectId", "not-an-id", "_id");
    expect(normalizeError(error)).toMatchObject({ statusCode: 400, code: "INVALID_ID" });
  });

  it("maps duplicate key errors to 409 without exposing the duplicated value", () => {
    const error = Object.assign(new Error("E11000"), {
      code: 11000,
      keyPattern: { email: 1 },
      keyValue: { email: "a@b.com" },
    });

    const normalized = normalizeError(error);

    expect(normalized).toMatchObject({ statusCode: 409, code: "DUPLICATE_KEY" });
    expect(JSON.stringify(normalized.details)).not.toContain("a@b.com");
  });

  it("maps leaked Firebase auth errors to 401", () => {
    expect(normalizeError({ code: "auth/argument-error" })).toMatchObject({
      statusCode: 401,
      code: "TOKEN_INVALID",
    });
  });

  it("maps leaked AWS SDK errors to STORAGE_PROVIDER_ERROR", () => {
    const error = Object.assign(new Error("AccessDenied"), { $metadata: { httpStatusCode: 403 } });
    expect(normalizeError(error)).toMatchObject({
      statusCode: 503,
      code: "STORAGE_PROVIDER_ERROR",
    });
  });

  it("maps unknown errors to a generic 500", () => {
    expect(normalizeError(new Error("db password is hunter2"))).toMatchObject({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message: "Internal server error",
      isOperational: false,
    });
  });
});

describe("error handler middleware", () => {
  it("hides stack traces and internal messages in production", () => {
    const handler = createErrorHandler({ logger, isProduction: true });
    const res = createRes();

    handler(new Error("secret detail"), { id: "req-1" }, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body).toEqual({
      success: false,
      error: { message: "Internal server error", code: "INTERNAL_ERROR", details: [] },
      meta: { requestId: "req-1" },
    });
    expect(JSON.stringify(body)).not.toContain("secret detail");
  });

  it("never exposes stack traces even outside production", () => {
    const handler = createErrorHandler({ logger, isProduction: false });
    const res = createRes();

    handler(new Error("boom"), { id: "req-2" }, res, vi.fn());

    expect(res.json.mock.calls[0][0]).not.toHaveProperty("stack");
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain("boom");
  });
});
