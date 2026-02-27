import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Input, Modal, Space, Table, Tabs, Tag, message } from 'antd';
import { adminAuditApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';
import { AuditCard } from './components/AuditCard';
import { RejectReasonModal } from './components/RejectReasonModal';

interface QueueItem {
  id: string;
  type: string;
  title: string;
  content: string;
  reportCount: number;
}

interface PendingItem {
  contentType: string;
  id: string;
  title?: string;
  content: string;
  authorId: string;
  authorName?: string;
  createdAt: string;
}

const reportTabItems = [
  { key: 'all', label: '全部' },
  { key: 'post', label: '帖子' },
  { key: 'blog', label: '博客' },
  { key: 'comment', label: '评论' },
  { key: 'project', label: '项目' },
];

const pendingTypeOptions = [
  { key: '', label: '全部' },
  { key: 'post', label: '帖子' },
  { key: 'blog', label: '博客' },
  { key: 'question', label: '问答' },
  { key: 'comment', label: '评论' },
  { key: 'answer', label: '回答' },
];

const contentTypeLabel: Record<string, string> = {
  post: '帖子',
  blog: '博客',
  question: '问答',
  comment: '评论',
  answer: '回答',
};

const AuditQueuePage = () => {
  const [mainTab, setMainTab] = useState('content');
  const [activeTab, setActiveTab] = useState('all');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [reportActionLoadingId, setReportActionLoadingId] = useState('');
  const [reportBatchLoading, setReportBatchLoading] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);

  // Content moderation state
  const [pendingType, setPendingType] = useState('');
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState('');
  const [rejectTarget, setRejectTarget] = useState<PendingItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailItem, setDetailItem] = useState<PendingItem | null>(null);

  const fetchQueue = useCallback(async () => {
    setError('');
    try {
      const response = await adminAuditApi.queue();
      const data = extractList<Record<string, unknown>>(response).map((item) => ({
        id: String(item.id ?? ''),
        type: String(item.targetType ?? '内容'),
        title: `${String(item.targetType ?? '内容')} #${String(item.targetId ?? '')}`,
        content: String(item.description ?? item.reason ?? ''),
        reportCount: 1,
      }));
      setQueue(data.filter((item) => item.id));
    } catch (err) {
      setError(getErrorMessage(err, '审核队列加载失败'));
      setQueue([]);
    }
  }, []);

  const fetchPending = useCallback(async () => {
    setPendingLoading(true);
    setPendingError('');
    try {
      const params = pendingType ? { type: pendingType } : {};
      const response = await adminAuditApi.pendingQueue(params);
      const data = extractList<Record<string, unknown>>(response).map((item) => ({
        contentType: String(item.contentType ?? ''),
        id: String(item.id ?? ''),
        title: item.title ? String(item.title) : undefined,
        content: String(item.content ?? ''),
        authorId: String(item.authorId ?? ''),
        authorName: item.authorName ? String(item.authorName) : undefined,
        createdAt: String(item.createdAt ?? ''),
      }));
      setPendingItems(data);
    } catch (err) {
      setPendingError(getErrorMessage(err, '待审核队列加载失败'));
      setPendingItems([]);
    } finally {
      setPendingLoading(false);
    }
  }, [pendingType]);

  useEffect(() => {
    if (mainTab === 'content') {
      void fetchPending();
    } else {
      void fetchQueue();
    }
  }, [mainTab, fetchPending, fetchQueue]);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return queue;
    return queue.filter((item) => item.type.toLowerCase().includes(activeTab));
  }, [activeTab, queue]);

  const handleApprove = async (item: PendingItem) => {
    try {
      await adminAuditApi.approvePending(item.contentType, item.id);
      void fetchPending();
    } catch (err) {
      setPendingError(getErrorMessage(err, '通过审核失败'));
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await adminAuditApi.rejectPending(rejectTarget.contentType, rejectTarget.id, { reason: rejectReason || '不符合社区规范' });
      setRejectTarget(null);
      setRejectReason('');
      void fetchPending();
    } catch (err) {
      setPendingError(getErrorMessage(err, '拒绝审核失败'));
    }
  };

  const handleApproveReport = async (id: string) => {
    setReportActionLoadingId(id);
    try {
      await adminAuditApi.approve(id);
      await fetchQueue();
      message.success('举报已通过处理');
    } catch (err) {
      setError(getErrorMessage(err, '举报通过失败'));
    } finally {
      setReportActionLoadingId('');
    }
  };

  const handleDeleteReport = async (id: string) => {
    setReportActionLoadingId(id);
    try {
      await adminAuditApi.delete(id);
      await fetchQueue();
      message.success('举报已删除');
    } catch (err) {
      setError(getErrorMessage(err, '举报删除失败'));
    } finally {
      setReportActionLoadingId('');
    }
  };

  const handleBatchReport = async (action: 'approve' | 'reject') => {
    if (!filtered.length) {
      message.info('当前没有可处理的举报');
      return;
    }

    setReportBatchLoading(true);
    const tasks = filtered.map((item) =>
      action === 'approve' ? adminAuditApi.approve(item.id) : adminAuditApi.reject(item.id, { reason: '不符合社区规范' }),
    );
    const result = await Promise.allSettled(tasks);
    const successCount = result.filter((item) => item.status === 'fulfilled').length;
    const failedCount = filtered.length - successCount;

    if (successCount > 0) {
      message.success(`批量${action === 'approve' ? '通过' : '拒绝'}成功 ${successCount} 条`);
    }
    if (failedCount > 0) {
      message.warning(`${failedCount} 条处理失败，请重试`);
    }

    await fetchQueue();
    setReportBatchLoading(false);
  };

  const pendingColumns = [
    {
      title: '类型',
      dataIndex: 'contentType',
      key: 'contentType',
      width: 80,
      render: (v: string) => <Tag>{contentTypeLabel[v] ?? v}</Tag>,
    },
    {
      title: '标题/内容',
      key: 'titleContent',
      ellipsis: true,
      render: (_: unknown, record: PendingItem) => (
        <a onClick={() => setDetailItem(record)} style={{ cursor: 'pointer' }}>
          {record.title || (record.content.length > 60 ? record.content.slice(0, 60) + '...' : record.content)}
        </a>
      ),
    },
    {
      title: '作者',
      dataIndex: 'authorName',
      key: 'authorName',
      width: 120,
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: unknown, record: PendingItem) => (
        <Space>
          <Button type="primary" size="small" onClick={() => handleApprove(record)}>通过</Button>
          <Button danger size="small" onClick={() => { setRejectTarget(record); setRejectReason(''); }}>拒绝</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="module-header">
        <h2>审核队列</h2>
      </div>

      <Tabs
        activeKey={mainTab}
        onChange={setMainTab}
        items={[
          { key: 'content', label: '内容审核' },
          { key: 'report', label: '举报审核' },
        ]}
      />

      {mainTab === 'content' && (
        <>
          {pendingError && <Alert type="error" showIcon message={pendingError} style={{ marginBottom: 12 }} />}
          <Space style={{ marginBottom: 12 }}>
            {pendingTypeOptions.map((opt) => (
              <Button
                key={opt.key}
                type={pendingType === opt.key ? 'primary' : 'default'}
                size="small"
                onClick={() => setPendingType(opt.key)}
              >
                {opt.label}
              </Button>
            ))}
          </Space>
          <Table
            rowKey={(record) => `${record.contentType}-${record.id}`}
            columns={pendingColumns}
            dataSource={pendingItems}
            loading={pendingLoading}
            pagination={{ pageSize: 20 }}
            size="middle"
          />

          <Modal
            title="拒绝原因"
            open={!!rejectTarget}
            onOk={handleReject}
            onCancel={() => { setRejectTarget(null); setRejectReason(''); }}
            okText="确认拒绝"
            cancelText="取消"
          >
            <Input.TextArea
              rows={3}
              placeholder="请输入拒绝原因"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </Modal>

          <Modal
            title="内容详情"
            open={!!detailItem}
            onCancel={() => setDetailItem(null)}
            footer={detailItem ? (
              <Space>
                <Button onClick={() => setDetailItem(null)}>关闭</Button>
                <Button type="primary" onClick={() => { handleApprove(detailItem); setDetailItem(null); }}>通过</Button>
                <Button danger onClick={() => { setRejectTarget(detailItem); setDetailItem(null); }}>拒绝</Button>
              </Space>
            ) : null}
            width={640}
          >
            {detailItem && (
              <div>
                <p><strong>类型：</strong>{contentTypeLabel[detailItem.contentType] ?? detailItem.contentType}</p>
                {detailItem.title && <p><strong>标题：</strong>{detailItem.title}</p>}
                <p><strong>作者：</strong>{detailItem.authorName ?? detailItem.authorId}</p>
                <p><strong>提交时间：</strong>{new Date(detailItem.createdAt).toLocaleString('zh-CN')}</p>
                <div style={{ marginTop: 12, padding: 12, background: '#f5f5f5', borderRadius: 6, maxHeight: 400, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {detailItem.content}
                </div>
              </div>
            )}
          </Modal>
        </>
      )}

      {mainTab === 'report' && (
        <>
          <Space style={{ marginBottom: 12 }}>
            <Button loading={reportBatchLoading} onClick={() => void handleBatchReport('approve')}>
              批量通过
            </Button>
            <Button loading={reportBatchLoading} onClick={() => void handleBatchReport('reject')}>
              批量拒绝
            </Button>
          </Space>
          {error && <Alert type="error" showIcon message={error} />}
          <Tabs items={reportTabItems} activeKey={activeTab} onChange={setActiveTab} />
          {filtered.map((item) => (
            <AuditCard
              key={item.id}
              item={item}
              loading={reportActionLoadingId === item.id}
              onApprove={() => void handleApproveReport(item.id)}
              onReject={() => {
                setSelectedId(item.id);
                setRejectOpen(true);
              }}
              onDelete={() => void handleDeleteReport(item.id)}
            />
          ))}
          <RejectReasonModal
            open={rejectOpen}
            loading={rejectSubmitting}
            onCancel={() => { setRejectOpen(false); setSelectedId(''); }}
            onOk={async (reason) => {
              if (selectedId) {
                setRejectSubmitting(true);
                try {
                  await adminAuditApi.reject(selectedId, { reason });
                  await fetchQueue();
                  message.success('举报已拒绝');
                } catch (err) {
                  setError(getErrorMessage(err, '举报拒绝失败'));
                } finally {
                  setRejectSubmitting(false);
                }
              }
              setRejectOpen(false);
              setSelectedId('');
            }}
          />
        </>
      )}
    </div>
  );
};

export default AuditQueuePage;
