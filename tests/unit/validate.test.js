import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { AppError } from "../../src/common/errors/app-error.js";
import { validate } from "../../src/common/middlewares/validate.js";
import { updateMeBodySchema } from "../../src/modules/users/users.validation.js";

const run = (middleware, req) => {
  const next = vi.fn();
  middleware(req, {}, next);
  return next;
};

describe("validate middleware", () => {
  const middleware = validate({
    params: z.object({ id: z.string().length(3) }),
    query: z.object({ page: z.coerce.number().int().min(1).default(1) }),
    body: z.object({ name: z.string().trim().min(1) }).strict(),
  });

  it("attaches parsed data to req.validated for a valid request", () => {
    const req = { params: { id: "abc" }, query: { page: "2" }, body: { name: "  Tofu  " } };

    const next = run(middleware, req);

    expect(next).toHaveBeenCalledWith();
    expect(req.validated).toEqual({
      params: { id: "abc" },
      query: { page: 2 },
      body: { name: "Tofu" },
    });
  });

  it("collects issues from every location into one VALIDATION_ERROR", () => {
    const req = {
      params: { id: "toolong" },
      query: { page: "0" },
      body: { name: "", extra: true },
    };

    const next = run(middleware, req);
    const error = next.mock.calls[0][0];

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
    });
    expect(new Set(error.details.map((detail) => detail.location))).toEqual(
      new Set(["params", "query", "body"]),
    );
    expect(req.validated).toBeUndefined();
  });

  it("treats a missing body as an empty object", () => {
    const next = run(validate({ body: z.object({ name: z.string() }) }), { body: undefined });

    expect(next.mock.calls[0][0].details[0]).toMatchObject({ location: "body", path: "name" });
  });
});

describe("updateMeBodySchema", () => {
  it("accepts and normalizes a valid username", () => {
    expect(updateMeBodySchema.parse({ username: " Vegan.Chef_01 " })).toEqual({
      username: "vegan.chef_01",
    });
  });

  it.each([{ role: "ADMIN" }, { status: "BANNED" }, { firebaseUid: "x" }])(
    "rejects system field %o",
    (payload) => {
      expect(updateMeBodySchema.safeParse({ username: "valid_name", ...payload }).success).toBe(
        false,
      );
    },
  );

  it.each(["ab", "a".repeat(31), ".dot_start", "dot_end.", "has space", "emoji😀"])(
    "rejects username %s",
    (username) => {
      expect(updateMeBodySchema.safeParse({ username }).success).toBe(false);
    },
  );
});
