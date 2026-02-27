import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Modal, Space, message } from 'antd';
import { adminCommentApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';
import { CommentTable, type CommentRow } from './components/CommentTable';

const CommentManagePage = () => {
  const [loading, setLoading] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [previewRecord, setPreviewRecord] = useState<CommentRow | null>(null);
  const [data, setData] = useState<CommentRow[]>([]);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminCommentApi.comments();
      const list = extractList<Record<string, unknown>>(response).map((item) => ({
        key: String(item.id ?? ''),
        content: String(item.content ?? '').slice(0, 120),
        author: String((item.author as { username?: string; nickname?: string } | undefined)?.nickname ?? (item.author as { username?: string } | undefined)?.username ?? item.authorId ?? '-'),
        targetType: String(item.targetType ?? ''),
        targetId: String(item.targetId ?? ''),
        target: `${String(item.targetType ?? '')}#${String(item.targetId ?? '')}`,
        createdAt: String(item.createdAt ?? ''),
      }));

      const normalized = list.filter((item) => item.key);
      setData(normalized);
      setSelectedRowKeys((current) => current.filter((id) => normalized.some((item) => item.key === id)));
    } catch (err) {
      setError(getErrorMessage(err, '评论列表加载失败'));
      setData([]);
      setSelectedRowKeys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  const handleLocate = (record: CommentRow) => {
    setPreviewRecord(record);
  };

  const handleDelete = async (record: CommentRow) => {
    setDeletingId(record.key);
    setError('');
    try {
      await adminCommentApi.deleteComment(record.key);
      message.success('评论已删除');
      await fetchComments();
    } catch (err) {
      setError(getErrorMessage(err, '删除评论失败'));
    } finally {
      setDeletingId('');
    }
  };

  const handleBatchDelete = async () => {
    if (!selectedRowKeys.length) {
      message.warning('请先选择评论');
      return;
    }

    setBatchDeleting(true);
    setError('');
    try {
      await adminCommentApi.batchDelete({ ids: selectedRowKeys });
      message.success(`已批量删除 ${selectedRowKeys.length} 条评论`);
      setSelectedRowKeys([]);
      await fetchComments();
    } catch (err) {
      setError(getErrorMessage(err, '批量删除评论失败'));
    } finally {
      setBatchDeleting(false);
    }
  };

  return (
    <Card
      title="评论管理"
      loading={loading}
      extra={
        <Space>
          <Button danger loading={batchDeleting} disabled={!selectedRowKeys.length} onClick={() => void handleBatchDelete()}>
            批量删除
          </Button>
        </Space>
      }
    >
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <CommentTable
        data={data}
        selectedRowKeys={selectedRowKeys}
        deletingId={deletingId}
        onSelectionChange={setSelectedRowKeys}
        onLocate={handleLocate}
        onDelete={handleDelete}
      />
      <Modal
        title="评论原文信息"
        open={Boolean(previewRecord)}
        onCancel={() => setPreviewRecord(null)}
        footer={null}
      >
        {previewRecord && (
          <div style={{ display: 'grid', gap: 10 }}>
            <div>
              <strong>所属内容：</strong>
              {previewRecord.target}
            </div>
            <div>
              <strong>评论作者：</strong>
              {previewRecord.author}
            </div>
            <div>
              <strong>发布时间：</strong>
              {previewRecord.createdAt}
            </div>
            <div>
              <strong>评论内容：</strong>
              <div
                style={{
                  marginTop: 6,
                  maxHeight: 320,
                  overflow: 'auto',
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {previewRecord.content || '-'}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default CommentManagePage;
