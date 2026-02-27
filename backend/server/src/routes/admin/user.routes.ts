import { Router } from 'express';
import { adminUserController } from '../../controllers/admin/user.controller';

export const adminUserRoutes = Router();

adminUserRoutes.get('/users', adminUserController.list);
adminUserRoutes.get('/users/:id', adminUserController.detail);
adminUserRoutes.put('/users/:id', adminUserController.update);
adminUserRoutes.post('/users/:id/ban', adminUserController.ban);
adminUserRoutes.post('/users/:id/unban', adminUserController.unban);
adminUserRoutes.post('/users/:id/mute', adminUserController.mute);
adminUserRoutes.post('/users/:id/unmute', adminUserController.unmute);
adminUserRoutes.put('/users/:id/role', adminUserController.role);
adminUserRoutes.post('/users/:id/reset-pwd', adminUserController.resetPwd);
adminUserRoutes.put('/users/:id/points', adminUserController.points);
adminUserRoutes.get('/roles', adminUserController.roles);
adminUserRoutes.put('/roles/:id', adminUserController.updateRoleConfig);
adminUserRoutes.get('/ip-blacklist', adminUserController.ipBlacklistList);
adminUserRoutes.post('/ip-blacklist', adminUserController.ipBlacklistAdd);
adminUserRoutes.delete('/ip-blacklist/:id', adminUserController.ipBlacklistRemove);
adminUserRoutes.get('/ip-whitelist', adminUserController.ipWhitelistList);
adminUserRoutes.post('/ip-whitelist', adminUserController.ipWhitelistAdd);
adminUserRoutes.delete('/ip-whitelist/:id', adminUserController.ipWhitelistRemove);
