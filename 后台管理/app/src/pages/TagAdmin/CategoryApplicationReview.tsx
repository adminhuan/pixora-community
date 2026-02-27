import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Select, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { adminTagApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';
import { openTextInputModal } from '../../utils/modal-input';

type ReviewStatus = 'all' | 'pending' | 'approved' | 'rejected';

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
] as const;

const typeLabelMap: Record<string, string> = {
  post: '论坛分类',
  blog: '博客分类',
  project: '项目分类',
};

const statusTag = (status: string) => {
  if (status === 'approved') {
    return <Tag color="green">已通过</Tag>;
  }
  if (status === 'rejected') {
    return <Tag color="red">已驳回</Tag>;
  }
  return <Tag color="orange">待审核</Tag>;
};

const CategoryApplicationReviewPage = () => {
  const [loading, setLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<ReviewStatus>('pending');
  const [keyword, setKeyword] = useState('');
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = status === 'all' ? undefined : { status };
      const response = await adminTagApi.categoryApplications(params);
      setData(extractList<Record<string, unknown>>(response));
    } catch (err) {
      setError(getErrorMessage(err, '分类申请列表加载失败'));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    if (!text) {
      return data;
    }

    return data.filter((item) => {
      const name = String(item.name ?? '').toLowerCase();
      const applicantName = String(item.applicantName ?? '').toLowerCase();
      const reason = String(item.reason ?? '').toLowerCase();
      return name.includes(text) || applicantName.includes(text) || reason.includes(text);
    });
  }, [data, keyword]);

  const review = async (record: Record<string, unknown>, decision: 'approve' | 'reject') => {
    const id = String(record.id ?? '').trim();
    if (!id) {
      return;
    }

    const comment = await openTextInputModal({
      title: decision === 'approve' ? '通过备注（可选）' : '驳回原因（可选）',
      placeholder: '可留空',
      required: false,
      multiline: true,
      rows: 3,
    });
    if (comment === null) {
      return;
    }

    setReviewingId(id);
    setError('');

    try {
      await adminTagApi.reviewCategoryApplication(id, {
        decision,
        comment,
      });
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err, decision === 'approve' ? '通过申请失败' : '驳回申请失败'));
    } finally {
      setReviewingId('');
    }
  };

  return (
    <Card
      title="分类申请审核"
      extra={
        <Space>
          <Select
            style={{ width: 150 }}
            value={status}
            options={statusOptions as unknown as Array<{ value: string; label: string }>}
            onChange={(value) => setStatus(value as ReviewStatus)}
          />
          <Input.Search
            style={{ width: 220 }}
            allowClear
            placeholder="搜索分类名/申请人"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Button onClick={() => void fetchData()}>刷新</Button>
        </Space>
      }
      loading={loading}
    >
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}

      <Table
        rowKey={(record) => String(record.id ?? '')}
        dataSource={filtered}
        columns={[
          {
            title: '分类名称',
            dataIndex: 'name',
            width: 180,
          },
          {
            title: '分类类型',
            dataIndex: 'type',
            width: 120,
            render: (value: string) => typeLabelMap[value] ?? value,
          },
          {
            title: '申请人',
            width: 140,
            render: (_: unknown, record: Record<string, unknown>) =>
              String((record.applicant as { nickname?: string; username?: string } | undefined)?.nickname ?? record.applicantName ?? '-'),
          },
          {
            title: '申请理由',
            dataIndex: 'reason',
            ellipsis: true,
          },
          {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (value: string) => statusTag(String(value ?? 'pending')),
          },
          {
            title: '申请时间',
            dataIndex: 'createdAt',
            width: 170,
            render: (value: string) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'),
          },
          {
            title: '审核信息',
            width: 220,
            render: (_: unknown, record: Record<string, unknown>) => {
              const reviewer = record.reviewer as { nickname?: string; username?: string } | undefined;
              const reviewerName = String(reviewer?.nickname ?? reviewer?.username ?? '-');
              const reviewedAt = String(record.reviewedAt ?? '');
              const comment = String(record.reviewComment ?? '').trim();

              if (!reviewedAt && !comment) {
                return '-';
              }

              return (
                <div style={{ display: 'grid', gap: 4 }}>
                  <span>{reviewerName}</span>
                  <span style={{ color: 'var(--admin-text-secondary)', fontSize: 12 }}>
                    {reviewedAt ? dayjs(reviewedAt).format('YYYY-MM-DD HH:mm') : '-'}
                  </span>
                  {comment && <span style={{ color: 'var(--admin-text-secondary)', fontSize: 12 }}>{comment}</span>}
                </div>
              );
            },
          },
          {
            title: '操作',
            width: 180,
            render: (_: unknown, record: Record<string, unknown>) => {
              const rowStatus = String(record.status ?? 'pending');
              const id = String(record.id ?? '');
              const disabled = rowStatus !== 'pending' || reviewingId === id;

              return (
                <Space>
                  <Button size="small" type="primary" disabled={disabled} onClick={() => void review(record, 'approve')}>
                    通过
                  </Button>
                  <Button size="small" danger disabled={disabled} onClick={() => void review(record, 'reject')}>
                    驳回
                  </Button>
                </Space>
              );
            },
          },
        ]}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default CategoryApplicationReviewPage;
