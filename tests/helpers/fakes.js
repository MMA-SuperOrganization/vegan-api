import { randomBytes } from "node:crypto";

import { ERROR_CODES } from "../../src/common/constants/error-codes.js";
import { AppError } from "../../src/common/errors/app-error.js";

const newObjectId = () => randomBytes(12).toString("hex");

/**
 * Fake Firebase auth provider: map token → identity. Không gọi Firebase thật.
 * @param {Record<string, { firebaseUid: string, email: string | null }>} tokens
 */
export const createFakeAuthProvider = (tokens = {}) => ({
  async verifyIdToken(token) {
    if (token === "expired-token") {
      throw AppError.unauthorized("Authentication token has expired", ERROR_CODES.TOKEN_EXPIRED);
    }
    const identity = tokens[token];
    if (!identity) {
      throw AppError.unauthorized("Invalid authentication token", ERROR_CODES.TOKEN_INVALID);
    }
    return { emailVerified: true, authTime: null, ...identity };
  },
});

/** In-memory repository tuân theo cùng contract với user.repository.js. */
export const createInMemoryUserRepository = (seed = []) => {
  const users = new Map();
  const clone = (user) => (user ? structuredClone(user) : null);

  for (const user of seed) {
    const now = new Date();
    const record = {
      _id: newObjectId(),
      role: "USER",
      status: "ACTIVE",
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
      ...user,
    };
    users.set(record._id, record);
  }

  const duplicateError = (field) =>
    Object.assign(new Error("E11000 duplicate key"), { code: 11000, keyPattern: { [field]: 1 } });

  return {
    users,
    async findById(id) {
      return clone(users.get(String(id)));
    },
    async findByFirebaseUid(firebaseUid) {
      return clone([...users.values()].find((user) => user.firebaseUid === firebaseUid));
    },
    async findByUsername(username) {
      return clone([...users.values()].find((user) => user.username === username));
    },
    async create(data) {
      if ([...users.values()].some((user) => user.firebaseUid === data.firebaseUid))
        throw duplicateError("firebaseUid");
      const now = new Date();
      const record = {
        _id: newObjectId(),
        role: "USER",
        status: "ACTIVE",
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
        ...data,
      };
      users.set(record._id, record);
      return clone(record);
    },
    async updateById(id, changes) {
      const user = users.get(String(id));
      if (!user) return null;

      if (changes.username !== undefined) {
        if ([...users.values()].some((u) => u.username === changes.username && u._id !== id)) {
          throw duplicateError("username");
        }
      }

      Object.assign(user, changes, { updatedAt: new Date() });
      return clone(user);
    },
  };
};

/** Fake storage provider theo contract của r2-storage.provider.js. */
export const createFakeStorageProvider = () => {
  const calls = [];
  const objects = new Map();
  return {
    calls,
    objects,
    async createUploadUrl(input) {
      calls.push(input);
      return {
        url: `https://fake-r2.example.com/${input.key}?X-Amz-Signature=fake`,
        expiresAt: new Date(Date.now() + input.expiresIn * 1000),
      };
    },
    async createDownloadUrl({ key, expiresIn }) {
      return {
        url: `https://fake-r2.example.com/${key}?download`,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      };
    },
    async getObjectMetadata(input) {
      return objects.get(typeof input === "string" ? input : input.key) ?? null;
    },
    async deleteObject(input) {
      objects.delete(typeof input === "string" ? input : input.key);
    },
    getPublicUrl(key) {
      return `https://cdn.example.com/${key}`;
    },
  };
};
