import { sendSuccess, sendError } from "../../common/utils/api-response.js";

export const createHealthController = ({ healthService }) => ({
  async checkLiveness(req, res) {
    const isConnected = healthService.getDatabaseStatus() === "connected";
    const result = {
      status: isConnected ? "ok" : "degraded",
      environment: process.env.NODE_ENV || "test",
      services: {
        database: healthService.getDatabaseStatus(),
      },
    };
    
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        message: "Service is degraded",
        data: result,
      });
    }
    
    return sendSuccess(res, { data: result, message: "Service is healthy" });
  },
  async checkReadiness(req, res) {
    return sendSuccess(res, { data: {}, message: "checkReadiness success" });
  },
});
