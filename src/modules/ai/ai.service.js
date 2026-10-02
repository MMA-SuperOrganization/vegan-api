import { AppError } from "../../common/errors/app-error.js";

export const createAiService = ({ aiRepository }) => ({
  async getAiConversations(req) {
    return await aiRepository.findAll(req.query);
  },
  async createAiConversation(req) {
    return await aiRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async getAiMessages(req) {
    return await aiRepository.findById(
      req.params.id || req.params.idOrSlug || req.params.userId || "dummy",
    );
  },
  async sendAiMessage(req) {
    return await aiRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async createMealPlanProposal(req) {
    return await aiRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async confirmMealPlanProposal(req) {
    return await aiRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async recognizeIngredients(req) {
    return await aiRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async confirmPantryProposal(req) {
    return await aiRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async generateVideoSummary(req) {
    return await aiRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async submitAiFeedback(req) {
    return await aiRepository.update(
      req.params.id || req.params.targetId || req.auth?.userId || "dummy",
      req.validated.body,
    );
  },
});
