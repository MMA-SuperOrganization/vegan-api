/**
 * Gửi response thành công theo format thống nhất:
 * { success: true, message, data, meta }
 */
export const sendSuccess = (
  res,
  { statusCode = 200, message = "Request completed successfully", data = null, meta = null } = {},
) => res.status(statusCode).json({ success: true, message, data, meta });

/**
 * Tạo body lỗi theo format thống nhất:
 * { success: false, message, code, errors, requestId }
 */
export const buildErrorBody = ({ message, code, errors = [], requestId = null }) => ({
  success: false,
  message,
  code,
  errors,
  requestId,
});
