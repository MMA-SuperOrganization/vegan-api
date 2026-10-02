import { AppError } from '../../common/errors/app-error.js';

export const createUsersService = ({ usersRepository, now = () => new Date() }) => ({
  async getMyProfileSummary(req) {
    return await usersRepository.findAll(req.query);
  },
  async updateMyProfile(req) {
    return await usersRepository.update(req.params.id || req.params.targetId || req.auth?.userId || 'dummy', req.validated.body);
  },
  async deleteMyAccount(req) {
    return await usersRepository.delete(req.params.id || req.params.targetId || req.auth?.userId || 'dummy');
  },
  async getPublicUserProfile(req) {
    return await usersRepository.findAll(req.query);
  },
  async getMyContent(req) {
    return await usersRepository.findAll(req.query);
  },
  async getMyActivity(req) {
    return await usersRepository.findAll(req.query);
  },
  async getMyFullProfile(req) {
    return await usersRepository.findAll(req.query);
  },
  async upsertMyProfile(req) {
    return await usersRepository.update(req.params.id || req.params.targetId || req.auth?.userId || 'dummy', req.validated.body);
  },
  async suspendUser(req) {
    return await usersRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async activateUser(req) {
    return await usersRepository.create({ ...req.validated.body, userId: req.auth?.userId });
  },
  async getAdminUsers(req) {
    return await usersRepository.findAll(req.query);
  },
  async getAdminUserDetail(req) {
    return await usersRepository.findById(req.params.id || req.params.idOrSlug || req.params.userId || 'dummy');
  },
  async changeUserRole(req) {
    return await usersRepository.update(req.params.id || req.params.targetId || req.auth?.userId || 'dummy', req.validated.body);
  },
  async resolveAuthenticatedUser({ firebaseUid, email }) {
    let user = await usersRepository.findByFirebaseUid(firebaseUid);
    if (!user) {
      try {
        user = await usersRepository.create({ firebaseUid, email });
      } catch (err) {
        if (err.code === 11000) {
          user = await usersRepository.findByFirebaseUid(firebaseUid);
        } else {
          throw err;
        }
      }
    }
    if (user.status !== "ACTIVE") {
      throw new AppError({ statusCode: 403, code: `ACCOUNT_${user.status}`, message: `Account is ${user.status}` });
    }
    
    const currentTime = now();
    if (!user.lastLoginAt || (currentTime - user.lastLoginAt) >= 60 * 60 * 1000) { // 1 hour threshold
      await usersRepository.updateById(user._id, { lastLoginAt: currentTime });
    }
    
    return user;
  },
  async updateCurrentUser(userId, data) {
    if (data.username) {
      const existing = await usersRepository.findByUsername(data.username);
      if (existing && existing._id.toString() !== userId.toString()) {
        throw new AppError({ statusCode: 409, code: "DUPLICATE_KEY", message: "Username is already taken" });
      }
    }
    return await usersRepository.updateById(userId, data);
  }
});
