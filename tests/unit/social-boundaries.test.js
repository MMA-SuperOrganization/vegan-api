import { describe, expect, it } from "vitest";

import { createCommentsValidation } from "../../src/modules/comments/comments.validation.js";
import { createReactionsValidation } from "../../src/modules/reactions/reactions.validation.js";

const targetId = "507f1f77bcf86cd799439011";

describe("recipe and post social boundaries", () => {
  it("accepts comments and reactions for posts", () => {
    expect(
      createCommentsValidation().createComment.body.parse({
        targetType: "post",
        targetId,
        content: "Useful tip",
      }),
    ).toMatchObject({ targetType: "post" });
    expect(
      createReactionsValidation().upsertReaction.params.parse({
        targetType: "post",
        targetId,
      }),
    ).toMatchObject({ targetType: "post" });
  });

  it("rejects recipe comments and reactions at the API boundary", () => {
    expect(() =>
      createCommentsValidation().createComment.body.parse({
        targetType: "recipe",
        targetId,
        content: "This belongs on a post",
      }),
    ).toThrow();
    expect(() =>
      createReactionsValidation().upsertReaction.params.parse({
        targetType: "recipe",
        targetId,
      }),
    ).toThrow();
  });
});
