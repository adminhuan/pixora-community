import { Router } from 'express';
import multer from 'multer';
import { userController } from '../controllers/user.controller';
import { auth, optionalAuth } from '../middleware/auth';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validator';
import { favoriteFolderValidator, updateProfileValidator, updateSettingsValidator } from '../validators/user.validator';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const userRoutes = Router();

userRoutes.get('/me', auth, userController.me);
userRoutes.put('/profile', auth, updateProfileValidator, validateRequest, userController.updateProfile);
userRoutes.put('/settings', auth, updateSettingsValidator, validateRequest, userController.updateSettings);
userRoutes.post('/avatar', auth, uploadRateLimiter, upload.single('file'), userController.uploadAvatar);
userRoutes.post('/cover', auth, uploadRateLimiter, upload.single('file'), userController.uploadCover);

userRoutes.post(
  '/favorites/folders',
  auth,
  favoriteFolderValidator,
  validateRequest,
  userController.createFavoriteFolder
);
userRoutes.put(
  '/favorites/folders/:id',
  auth,
  favoriteFolderValidator,
  validateRequest,
  userController.updateFavoriteFolder
);
userRoutes.delete('/favorites/folders/:id', auth, userController.deleteFavoriteFolder);

userRoutes.get('/:id', optionalAuth, userController.profile);

userRoutes.get('/:id/posts', optionalAuth, userController.posts);
userRoutes.get('/:id/blogs', optionalAuth, userController.blogs);
userRoutes.get('/:id/projects', optionalAuth, userController.projects);
userRoutes.get('/:id/snippets', optionalAuth, userController.snippets);
userRoutes.get('/:id/answers', optionalAuth, userController.answers);

userRoutes.get('/:id/followers', optionalAuth, userController.followers);
userRoutes.get('/:id/following', optionalAuth, userController.following);
userRoutes.post('/:id/follow', auth, userController.follow);
userRoutes.delete('/:id/follow', auth, userController.unfollow);

userRoutes.get('/:id/favorites', auth, userController.favorites);

userRoutes.get('/:id/contributions', optionalAuth, userController.contributions);
userRoutes.get('/:id/achievements', optionalAuth, userController.achievements);
userRoutes.get('/:id/points', optionalAuth, userController.points);
userRoutes.get('/:id/level', optionalAuth, userController.level);
