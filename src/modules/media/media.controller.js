import { sendSuccess } from "../../common/utils/api-response.js";

export const createMediaController = ({ mediaService }) => ({
  async createUploadRequest(req, res) {
    const result = await mediaService.createUploadRequest(req);
    return sendSuccess(res, {
      data: result || {},
      message: "Upload request created",
      statusCode: 201,
    });
  },
  async getMyMedia(req, res) {
    const result = await mediaService.getMyMedia(req);
    return sendSuccess(res, { data: result || {}, message: "getMyMedia success" });
  },
  async confirmMediaUpload(req, res) {
    const result = await mediaService.confirmMediaUpload(req);
    return sendSuccess(res, { data: result || {}, message: "confirmMediaUpload success" });
  },
  async getMediaAsset(req, res) {
    const result = await mediaService.getMediaAsset(req);
    return sendSuccess(res, { data: result || {}, message: "getMediaAsset success" });
  },
  async deleteMediaAsset(req, res) {
    const result = await mediaService.deleteMediaAsset(req);
    return sendSuccess(res, { data: result || {}, message: "deleteMediaAsset success" });
  },
});
