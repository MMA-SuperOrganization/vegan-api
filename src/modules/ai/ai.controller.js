import { sendSuccess } from "../../common/utils/api-response.js";

export const createAiController = ({ aiService }) => ({
  async getAiConversations(req, res) {
    const result = await aiService.getAiConversations(req);
    return sendSuccess(res, { data: result || {}, message: "getAiConversations success" });
  },
  async createAiConversation(req, res) {
    const result = await aiService.createAiConversation(req);
    return sendSuccess(res, { data: result || {}, message: "createAiConversation success" });
  },
  async getAiMessages(req, res) {
    const result = await aiService.getAiMessages(req);
    return sendSuccess(res, { data: result || {}, message: "getAiMessages success" });
  },
  async sendAiMessage(req, res) {
    const result = await aiService.sendAiMessage(req);
    return sendSuccess(res, { data: result || {}, message: "sendAiMessage success" });
  },
  async createMealPlanProposal(req, res) {
    const result = await aiService.createMealPlanProposal(req);
    return sendSuccess(res, { data: result || {}, message: "createMealPlanProposal success" });
  },
  async confirmMealPlanProposal(req, res) {
    const result = await aiService.confirmMealPlanProposal(req);
    return sendSuccess(res, { data: result || {}, message: "confirmMealPlanProposal success" });
  },
  async recognizeIngredients(req, res) {
    const result = await aiService.recognizeIngredients(req);
    return sendSuccess(res, { data: result || {}, message: "recognizeIngredients success" });
  },
  async confirmPantryProposal(req, res) {
    const result = await aiService.confirmPantryProposal(req);
    return sendSuccess(res, { data: result || {}, message: "confirmPantryProposal success" });
  },
  async generateVideoSummary(req, res) {
    const result = await aiService.generateVideoSummary(req);
    return sendSuccess(res, { data: result || {}, message: "generateVideoSummary success" });
  },
  async submitAiFeedback(req, res) {
    const result = await aiService.submitAiFeedback(req);
    return sendSuccess(res, { data: result || {}, message: "submitAiFeedback success" });
  },
});
