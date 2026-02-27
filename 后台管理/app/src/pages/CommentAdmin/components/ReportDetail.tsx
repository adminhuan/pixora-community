import { useState } from 'react';
import { Button, Card, Descriptions, Empty, Modal, Typography } from 'antd';
import { SafeMarkdown } from '../../../components/shared/safe-markdown';

interface ReportDetailProps {
  item?: Record<string, unknown> | null;
}

export const ReportDetail = ({ item }: ReportDetailProps) => {
  const [sourcePreviewOpen, setSourcePreviewOpen] = useState(false);

  if (!item) {
    return (
      <Card title="举报详情" size="small">
        <Empty description="请选择一条举报记录查看详情" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  const source = item.source && typeof item.source === 'object' ? (item.source as Record<string, unknown>) : null;
  const comment = item.comment && typeof item.comment === 'object' ? (item.comment as Record<string, unknown>) : null;

  const sourceTitle = String(source?.title ?? '-');
  const sourceContent = String(source?.content ?? '').trim();
  const commentContent = String(comment?.content ?? '').trim();

  return (
    <Card title="举报详情" size="small">
      <Descriptions column={1} size="small" labelStyle={{ width: 110 }}>
        <Descriptions.Item label="举报对象">
          {String(item.targetType ?? '')}#{String(item.targetId ?? '')}
        </Descriptions.Item>
        <Descriptions.Item label="举报原因">{String(item.reasonLabel ?? '-')}</Descriptions.Item>
        <Descriptions.Item label="举报说明">{String(item.description ?? '无补充说明')}</Descriptions.Item>
        <Descriptions.Item label="举报人">{String(item.reporterName ?? '-')}</Descriptions.Item>
        <Descriptions.Item label="被举报用户">{String(item.reportedUserName ?? '-')}</Descriptions.Item>
        <Descriptions.Item label="处理状态">{String(item.statusLabel ?? '-')}</Descriptions.Item>
        <Descriptions.Item label="处理结果">{String(item.handleResult ?? '未处理')}</Descriptions.Item>
        <Descriptions.Item label="处理人">{String(item.handledByName ?? '-')}</Descriptions.Item>
        <Descriptions.Item label="处理时间">{String(item.handledAtText ?? '-')}</Descriptions.Item>
      </Descriptions>

      <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
        <div>
          <Typography.Text strong>被举报评论内容</Typography.Text>
          <SafeMarkdown
            content={commentContent || '无评论内容'}
            style={{ marginTop: 4, color: 'var(--admin-text-secondary)', fontSize: 14 }}
          />
        </div>

        <div>
          <Typography.Text strong>所属文章标题</Typography.Text>
          <div style={{ marginTop: 4, color: 'var(--admin-text-secondary)' }}>{sourceTitle}</div>
        </div>

        <div>
          <Typography.Text strong>所属文章内容摘要</Typography.Text>
          <SafeMarkdown
            content={sourceContent ? `${sourceContent.slice(0, 300)}${sourceContent.length > 300 ? '...' : ''}` : '无内容摘要'}
            style={{ marginTop: 4, color: 'var(--admin-text-secondary)', fontSize: 14 }}
          />
        </div>

        <div>
          <Typography.Text strong>原文查看</Typography.Text>
          <div style={{ marginTop: 6 }}>
            <Button
              type="link"
              disabled={!sourceContent}
              onClick={() => {
                setSourcePreviewOpen(true);
              }}
              style={{ padding: 0 }}
            >
              {sourceContent ? '查看原文全文' : '暂无可查看原文'}
            </Button>
          </div>
        </div>
      </div>
      <Modal
        title="所属原文全文"
        open={sourcePreviewOpen}
        onCancel={() => setSourcePreviewOpen(false)}
        footer={null}
        width={760}
      >
        <div style={{ display: 'grid', gap: 10 }}>
          <div>
            <Typography.Text strong>标题：</Typography.Text>
            <span>{sourceTitle}</span>
          </div>
          <div
            style={{
              maxHeight: 520,
              overflow: 'auto',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
            }}
          >
            <SafeMarkdown content={sourceContent || '无原文内容'} style={{ fontSize: 14 }} />
          </div>
        </div>
      </Modal>
    </Card>
  );
};
