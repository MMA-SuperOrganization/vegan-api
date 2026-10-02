import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createHomeValidation = () => ({
  getHomeFeed: {
    query: paginationSchema.passthrough(),
  },
});
