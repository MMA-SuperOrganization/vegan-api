import { expect, it } from "vitest";
import request from "supertest";
import { buildTestApp, TEST_IDS } from "../helpers/test-app.js";

it("preserves an edited profile name across repeated Firebase account syncs", async () => {
  const { app, repositories } = buildTestApp();
  const auth = { Authorization: "Bearer user-token" };
  await request(app)
    .patch("/api/v1/users/me")
    .set(auth)
    .send({ displayName: "New profile name" })
    .expect(200);
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await request(app).post("/api/v1/auth/sync").set(auth).send({}).expect(200);
    expect(response.body.data.displayName).toBe("New profile name");
  }
  expect((await repositories.users.findById(TEST_IDS.user)).displayName).toBe("New profile name");
});

it("uses the identity name on first account creation", async () => {
  const { app } = buildTestApp();
  const response = await request(app)
    .post("/api/v1/auth/sync")
    .set("Authorization", "Bearer newcomer-token")
    .send({})
    .expect(200);
  expect(response.body.data.displayName).toBe("newcomer");
});
