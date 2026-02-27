import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import { auditService } from '../../services/admin/audit.service';

export const adminAuditController = {
  async queue(_req: Request, res: Response) {
    return sendSuccess(res, await auditService.queue(), '获取审核队列成功');
  },

  async approve(req: Request, res: Response) {
    return sendSuccess(res, await auditService.approve(req.params.id), '审核通过成功');
  },

  async reject(req: Request, res: Response) {
    return sendSuccess(res, await auditService.reject(req.params.id, req.body.reason), '审核拒绝成功');
  },

  async batch(req: Request, res: Response) {
    return sendSuccess(res, await auditService.batch(req.body.ids ?? [], req.body.action ?? 'approve'), '批量审核成功');
  },

  async history(_req: Request, res: Response) {
    return sendSuccess(res, await auditService.history(), '获取审核历史成功');
  },

  // --- Content moderation pending queue ---

  async pendingQueue(req: Request, res: Response) {
    const type = String(req.query.type ?? '').trim() || undefined;
    return sendSuccess(res, await auditService.pendingQueue(type), '获取待审核队列成功');
  },

  async approvePending(req: Request, res: Response) {
    const { contentType, id } = req.params;
    const operatorId = req.user?.id ?? '';
    return sendSuccess(res, await auditService.approveContent(contentType, id, operatorId), '审核通过成功');
  },

  async rejectPending(req: Request, res: Response) {
    const { contentType, id } = req.params;
    const operatorId = req.user?.id ?? '';
    const reason = String(req.body?.reason ?? '').trim();
    return sendSuccess(res, await auditService.rejectContent(contentType, id, operatorId, reason), '审核拒绝成功');
  },

  async batchPending(req: Request, res: Response) {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const action = req.body?.action === 'reject' ? 'reject' : 'approve';
    const operatorId = req.user?.id ?? '';
    const reason = String(req.body?.reason ?? '').trim();
    return sendSuccess(res, await auditService.batchPending(items, action, operatorId, reason), '批量审核成功');
  }
};
