import { createHash } from "node:crypto";
import { sendSuccess } from "./api-response.js";
import { CREATED } from "../constants/http-status.js";
// One adapter is reused by all manifest operations; business rules remain in services.
export const createOperationControllers = ({ operations, clock = () => new Date() }) =>
  Object.fromEntries(
    Object.entries(operations).map(([operationId, operation]) => [
      operationId,
      async (req, res, next) => {
        try {
          const result = await operation({
            actor: req.auth ?? null,
            body: req.validated.body ?? {},
            params: req.validated.params ?? {},
            query: req.validated.query ?? {},
            requestId: req.id,
            ipHash: createHash("sha256")
              .update(req.ip + ":" + clock().toISOString().slice(0, 10))
              .digest("hex"),
          });
          const list =
            result &&
            typeof result === "object" &&
            Object.hasOwn(result, "data") &&
            Object.hasOwn(result, "meta");
          sendSuccess(res, {
            statusCode: CREATED.has(operationId) ? 201 : 200,
            data: list ? result.data : (result ?? {}),
            meta: list ? result.meta : {},
          });
        } catch (error) {
          next(error);
        }
      },
    ]),
  );
