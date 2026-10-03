import { z } from "zod";
import { emptyBody, text, uuid } from "../../common/validators/domain.schemas.js";
export const createAuthValidation = () => ({
  syncAuth: { body: emptyBody },
  getMe: {},
  addFcmToken: {
    body: z
      .object({
        token: text(4096, 1),
        platform: z.literal("android").default("android"),
        deviceName: text(100).optional(),
      })
      .strict(),
  },
  removeFcmToken: { params: z.object({ tokenId: uuid }).strict() },
});
