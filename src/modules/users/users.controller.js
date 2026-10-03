import { sendSuccess } from "../../common/utils/api-response.js";

export const createUsersController = ({ usersService }) => ({
  async getMyProfileSummary(req, res) {
    const user = await usersService.resolveAuthenticatedUser(req.auth);
    if (user && user._id) {
      user.id = user._id.toString();
      delete user._id;
    }
    return sendSuccess(res, { data: user, message: "Current user retrieved successfully" });
  },
  async updateMyProfile(req, res) {
    const result = await usersService.updateCurrentUser(req.auth.userId, req.validated.body);
    if (result && result._id) {
      result.id = result._id.toString();
      delete result._id;
    }
    return sendSuccess(res, { data: result, message: "updateMyProfile success" });
  },
  async deleteMyAccount(req, res) {
    const result = await usersService.deleteMyAccount(req);
    return sendSuccess(res, { data: result || {}, message: "deleteMyAccount success" });
  },
  async getPublicUserProfile(req, res) {
    const result = await usersService.getPublicUserProfile(req);
    return sendSuccess(res, { data: result || {}, message: "getPublicUserProfile success" });
  },
  async getMyContent(req, res) {
    const result = await usersService.getMyContent(req);
    return sendSuccess(res, { data: result || {}, message: "getMyContent success" });
  },
  async getMyActivity(req, res) {
    const result = await usersService.getMyActivity(req);
    return sendSuccess(res, { data: result || {}, message: "getMyActivity success" });
  },
  async getMyFullProfile(req, res) {
    const result = await usersService.getMyFullProfile(req);
    return sendSuccess(res, { data: result || {}, message: "getMyFullProfile success" });
  },
  async upsertMyProfile(req, res) {
    const result = await usersService.upsertMyProfile(req);
    return sendSuccess(res, { data: result || {}, message: "upsertMyProfile success" });
  },
  async suspendUser(req, res) {
    const result = await usersService.suspendUser(req);
    return sendSuccess(res, { data: result || {}, message: "suspendUser success" });
  },
  async activateUser(req, res) {
    const result = await usersService.activateUser(req);
    return sendSuccess(res, { data: result || {}, message: "activateUser success" });
  },
  async getAdminUsers(req, res) {
    const result = await usersService.getAdminUsers(req);
    return sendSuccess(res, { data: result || {}, message: "getAdminUsers success" });
  },
  async getAdminUserDetail(req, res) {
    const result = await usersService.getAdminUserDetail(req);
    return sendSuccess(res, { data: result || {}, message: "getAdminUserDetail success" });
  },
  async changeUserRole(req, res) {
    const result = await usersService.changeUserRole(req);
    return sendSuccess(res, { data: result || {}, message: "changeUserRole success" });
  },
});
