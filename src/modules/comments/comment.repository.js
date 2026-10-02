import { Comment } from "./comment.model.js";

export const createCommentRepository = () => {
  return {
    async findById(id) {
      return Comment.findById(id).lean();
    },

    async findMany(filter = {}, options = {}) {
      const { page = 1, limit = 50, sort = { createdAt: -1 } } = options;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        Comment.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        Comment.countDocuments(filter),
      ]);

      return {
        data,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    },

    async create(data) {
      const comment = new Comment(data);
      await comment.save();
      return comment.toObject();
    },

    async updateById(id, updateData) {
      return Comment.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    },
  };
};
