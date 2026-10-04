import mongoose from "mongoose";
import { AppError } from "../errors/app-error.js";

const queryOptions = (query, { session, projection, sort } = {}) => {
  if (session) query.session(session);
  if (projection) query.select(projection);
  if (sort) query.sort(sort);
  return query;
};

export const createRepository = (model) => ({
  collectionName: model.collection.name,
  castFilter(filter) {
    // Mongoose does not cast aggregation pipelines. Cast against the owning schema first.
    return model.find(filter).cast(model);
  },
  async findOne(filter, options = {}) {
    return queryOptions(model.findOne(filter), options).lean();
  },
  async findById(id, options = {}) {
    return queryOptions(model.findById(id), options).lean();
  },
  async findMany(filter = {}, options = {}) {
    const { page = 1, limit = 20 } = options;
    const query = queryOptions(model.find(filter), {
      ...options,
      sort: options.sort ?? { createdAt: -1, _id: -1 },
    });
    const countQuery = model.countDocuments(filter);
    if (options.session) countQuery.session(options.session);
    const dataQuery = query
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    // MongoDB sessions do not support parallel operations within a transaction.
    const [data, total] = options.session
      ? [await dataQuery, await countQuery]
      : await Promise.all([dataQuery, countQuery]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },
  async create(data, { session } = {}) {
    const [document] = await model.create([data], { session });
    return document.toObject();
  },
  async updateOne(filter, update, options = {}) {
    const { new: returnNew = true, ...queryOptions } = options;
    return model
      .findOneAndUpdate(filter, update, {
        returnDocument: returnNew ? "after" : "before",
        runValidators: true,
        setDefaultsOnInsert: true,
        ...queryOptions,
      })
      .lean();
  },
  async deleteOne(filter, options = {}) {
    return model.findOneAndDelete(filter, options).lean();
  },
  async count(filter = {}, { session } = {}) {
    const query = model.countDocuments(filter);
    if (session) query.session(session);
    return query;
  },
  async aggregate(pipeline, { session } = {}) {
    const query = model.aggregate(pipeline);
    if (session) query.session(session);
    return query;
  },
});

export const buildRepository = ({ repositories, key, model }) => {
  if (!repositories[key]) repositories[key] = createRepository(model);
  return repositories[key];
};

export const createTransaction =
  (connection = mongoose.connection) =>
  async (work) => {
    if (connection.readyState !== 1) {
      throw AppError.serviceUnavailable("Database is not ready", "DATABASE_UNAVAILABLE");
    }
    const session = await connection.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        result = await work(session);
      });
      return result;
    } catch (error) {
      if (error.code === 20 || error.codeName === "IllegalOperation") {
        throw AppError.serviceUnavailable(
          "This operation requires a MongoDB replica set",
          "TRANSACTIONS_REQUIRED",
        );
      }
      throw error;
    } finally {
      await session.endSession();
    }
  };
