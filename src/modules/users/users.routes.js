import { Router } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { validate } from '../../common/middlewares/validate.js';
import { authenticate, optionalAuthenticate } from '../../common/middlewares/auth-guards.js';
import { authorize } from '../../common/middlewares/authorize.js';
import { ROLES } from '../../common/constants/roles.js';

export const createUsersRoutes = ({ usersController, usersValidation }) => {
  const router = Router();
  router.get('/users/me', authenticate, validate(usersValidation.getMyProfileSummary), asyncHandler(usersController.getMyProfileSummary));
  router.patch('/users/me', authenticate, validate(usersValidation.updateMyProfile), asyncHandler(usersController.updateMyProfile));
  router.delete('/users/me', authenticate, validate(usersValidation.deleteMyAccount), asyncHandler(usersController.deleteMyAccount));
  router.get('/users/:userId/public', validate(usersValidation.getPublicUserProfile), asyncHandler(usersController.getPublicUserProfile));
  router.get('/users/me/content', authenticate, validate(usersValidation.getMyContent), asyncHandler(usersController.getMyContent));
  router.get('/users/me/activity', authenticate, validate(usersValidation.getMyActivity), asyncHandler(usersController.getMyActivity));
  router.get('/profiles/me', authenticate, validate(usersValidation.getMyFullProfile), asyncHandler(usersController.getMyFullProfile));
  router.put('/profiles/me', authenticate, validate(usersValidation.upsertMyProfile), asyncHandler(usersController.upsertMyProfile));
  router.post('/admin/users/:id/suspend', authenticate, authorize(ROLES.ADMIN), validate(usersValidation.suspendUser), asyncHandler(usersController.suspendUser));
  router.post('/admin/users/:id/activate', authenticate, authorize(ROLES.ADMIN), validate(usersValidation.activateUser), asyncHandler(usersController.activateUser));
  router.get('/admin/users', authenticate, authorize(ROLES.ADMIN), validate(usersValidation.getAdminUsers), asyncHandler(usersController.getAdminUsers));
  router.get('/admin/users/:id', authenticate, authorize(ROLES.ADMIN), validate(usersValidation.getAdminUserDetail), asyncHandler(usersController.getAdminUserDetail));
  router.patch('/admin/users/:id/role', authenticate, authorize(ROLES.ADMIN), validate(usersValidation.changeUserRole), asyncHandler(usersController.changeUserRole));
  return router;
};
