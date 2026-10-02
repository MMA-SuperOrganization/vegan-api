import { z } from "zod";
import { objectId, paginationSchema } from "../../common/validators/common.schemas.js";

export const createHealthValidation = () => ({
  checkLiveness: {
    query: paginationSchema.passthrough(),
  },
  checkReadiness: {
    query: paginationSchema.passthrough(),
  },
});
