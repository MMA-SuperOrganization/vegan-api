import { Post } from "./post.model.js";

export const createPostRepository = () => {
  return {
    async findById(id) {
      return Post.findById(id).lean();
    },

    async findMany(filter = {}, options = {}) {
      const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        Post.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        Post.countDocuments(filter),
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
      const post = new Post(data);
      await post.save();
      return post.toObject();
    },

    async updateById(id, updateData) {
      return Post.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
    },
  };
};
