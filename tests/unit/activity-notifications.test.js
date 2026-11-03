import { describe, expect, it } from "vitest";

import { NOTIFICATION_TYPES } from "../../src/common/constants/enums/notification.enums.js";
import { buildTestApp, TEST_IDS } from "../helpers/test-app.js";

const postId = "200000000000000000000001";
const recipeId = "200000000000000000000002";

const fixture = () =>
  buildTestApp({
    seed: {
      posts: [
        {
          _id: postId,
          authorId: TEST_IDS.user,
          title: "A useful vegan tip",
          content: "Try this",
          status: "published",
          visibility: "public",
          deletedAt: null,
          reactionCount: 0,
          commentCount: 0,
        },
      ],
      recipes: [
        {
          _id: recipeId,
          authorId: TEST_IDS.user,
          title: "Green bowl",
          slug: "green-bowl",
          status: "pending_review",
          visibility: "public",
          deletedAt: null,
          ingredients: [{ foodItemId: "300000000000000000000001" }],
          steps: [{ order: 1, instruction: "Mix" }],
        },
      ],
    },
  });

const actors = {
  user: { userId: TEST_IDS.user, role: "user" },
  other: { userId: TEST_IDS.other, role: "user" },
  admin: { userId: TEST_IDS.admin, role: "admin" },
};

describe("activity notification integration", () => {
  it("notifies content owners for recipe review, comments and first reactions", async () => {
    const { container } = fixture();

    await container.operations.publishRecipe({
      actor: actors.admin,
      params: { id: recipeId },
      body: {},
    });
    await container.operations.createComment({
      actor: actors.other,
      body: { targetType: "post", targetId: postId, content: "Great tip" },
    });
    await container.operations.upsertReaction({
      actor: actors.other,
      params: { targetType: "post", targetId: postId },
      body: { type: "like" },
    });

    // Updating an existing reaction is not a new activity and must not create inbox spam.
    await container.operations.upsertReaction({
      actor: actors.other,
      params: { targetType: "post", targetId: postId },
      body: { type: "love" },
    });

    const inbox = await container.operations.getNotifications({ actor: actors.user });
    expect(inbox.data).toHaveLength(3);
    expect(inbox.data.map((item) => item.type).sort()).toEqual(
      [
        NOTIFICATION_TYPES.RECIPE_APPROVED,
        NOTIFICATION_TYPES.COMMENT_CREATED,
        NOTIFICATION_TYPES.REACTION_CREATED,
      ].sort(),
    );
    expect(inbox.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: NOTIFICATION_TYPES.RECIPE_APPROVED,
          data: expect.objectContaining({ targetType: "recipe", targetId: recipeId }),
        }),
        expect.objectContaining({
          type: NOTIFICATION_TYPES.COMMENT_CREATED,
          data: expect.objectContaining({ targetType: "post", targetId: postId }),
        }),
      ]),
    );
  });

  it("does not notify users about their own activity", async () => {
    const { container } = fixture();
    await container.operations.upsertReaction({
      actor: actors.user,
      params: { targetType: "post", targetId: postId },
      body: { type: "like" },
    });

    const inbox = await container.operations.getNotifications({ actor: actors.user });
    expect(inbox.data).toEqual([]);
  });

  it("notifies reply and comment-reaction owners with a navigable root target", async () => {
    const { container } = fixture();
    const root = await container.operations.createComment({
      actor: actors.user,
      body: { targetType: "post", targetId: postId, content: "My comment" },
    });
    await container.operations.createComment({
      actor: actors.other,
      body: {
        targetType: "post",
        targetId: postId,
        parentCommentId: root._id,
        content: "A reply",
      },
    });
    await container.operations.upsertReaction({
      actor: actors.other,
      params: { targetType: "comment", targetId: root._id },
      body: { type: "helpful" },
    });

    const inbox = await container.operations.getNotifications({ actor: actors.user });
    expect(inbox.data).toHaveLength(2);
    expect(inbox.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: NOTIFICATION_TYPES.COMMENT_REPLIED }),
        expect.objectContaining({
          type: NOTIFICATION_TYPES.REACTION_CREATED,
          data: expect.objectContaining({
            targetType: "post",
            targetId: postId,
            subjectType: "comment",
          }),
        }),
      ]),
    );
  });

  it("notifies the author when a recipe is rejected", async () => {
    const { container } = fixture();
    await container.operations.rejectRecipe({
      actor: actors.admin,
      params: { id: recipeId },
      body: { reason: "Add clearer preparation steps" },
    });

    const inbox = await container.operations.getNotifications({ actor: actors.user });
    expect(inbox.data).toEqual([
      expect.objectContaining({
        type: NOTIFICATION_TYPES.RECIPE_REJECTED,
        body: expect.stringContaining("Add clearer preparation steps"),
      }),
    ]);
  });
});
