/**
 * Express 5 đã tự chuyển rejected promise sang error middleware.
 * Helper này chỉ bind method của controller (tạo từ factory) để truyền thẳng vào router,
 * đồng thời vẫn chuyển lỗi về `next` cho handler đồng bộ lẫn bất đồng bộ.
 * @param {(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => unknown} handler
 */
export const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};
