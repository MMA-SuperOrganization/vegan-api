import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createAppConfigValidation = () => ({
  getAppConfig: {
    query: paginationSchema.passthrough(),
  },
  bootstrapApp: {
    query: paginationSchema.passthrough(),
  },
});
