import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useSearchParams } from 'react-router-dom';
import { adminOperationsApi } from '../../api/admin';
import { extractList, extractPagination, getErrorMessage } from '../../utils/api';

type NotificationRow = {
  key: string;
  id: string;
  recipientName: string;
  senderName: string;
  type: string;
  targetType: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationTargetType = '' | 'ip_protection_alert';
type NotificationReadStatus = 'all' | 'unread' | 'read';

const targetTypeLabelMap: Record<string, string> = {
  ip_protection_alert: 'IP防护告警'
};

const isReadLabelMap: Record<string, string> = {
  all: '全部状态',
  unread: '未读',
  read: '已读'
};

const targetTypeOptions = [
  { value: '', label: '全部通知' },
  { value: 'ip_protection_alert', label: 'IP防护告警' }
];

const isReadOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'unread', label: '未读' },
  { value: 'read', label: '已读' }
];

const normalizeTargetType = (value: string | null): NotificationTargetType => {
  if (value === 'ip_protection_alert') {
    return value;
  }
  return '';
};

const normalizeReadStatus = (value: string | null): NotificationReadStatus => {
  if (value === 'read' || value === 'unread') {
    return value;
  }
  return 'all';
};

const normalizeKeyword = (value: string | null): string => String(value ?? '').trim();

const SystemNotificationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [targetType, setTargetType] = useState<NotificationTargetType>(
    normalizeTargetType(searchParams.get('targetType'))
  );
  const [isRead, setIsRead] = useState<NotificationReadStatus>(normalizeReadStatus(searchParams.get('isRead')));
  const [keyword, setKeyword] = useState(() => normalizeKeyword(searchParams.get('keyword')));
  const [keywordInput, setKeywordInput] = useState(() => normalizeKeyword(searchParams.get('keyword')));

  const fetchData = useCallback(
    async (nextPage: number, nextLimit = limit) => {
      setLoading(true);
      setError('');
      try {
        const response = await adminOperationsApi.notifications({
          page: nextPage,
          limit: nextLimit,
          targetType: targetType || undefined,
          isRead,
          keyword: keyword || undefined
        });
        const list = extractList<Record<string, unknown>>(response).map((item) => ({
          key: String(item.id ?? ''),
          id: String(item.id ?? ''),
          recipientName: String(item.recipientName ?? '-'),
          senderName: String(item.senderName ?? 'system'),
          type: String(item.type ?? 'system'),
          targetType: String(item.targetType ?? ''),
          content: String(item.content ?? ''),
          isRead: Boolean(item.isRead ?? false),
          createdAt: String(item.createdAt ?? '-')
        }));
        const pagination = extractPagination(response);
        setRows(list.filter((item) => item.id));
        setPage(nextPage);
        setLimit(nextLimit);
        setTotal(Number(pagination?.total ?? list.length));
      } catch (err) {
        setError(getErrorMessage(err, '系统通知加载失败'));
        setRows([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [isRead, keyword, limit, targetType]
  );

  useEffect(() => {
    void fetchData(1);
  }, [fetchData]);

  useEffect(() => {
    const nextTargetType = normalizeTargetType(searchParams.get('targetType'));
    const nextIsRead = normalizeReadStatus(searchParams.get('isRead'));
    const nextKeyword = normalizeKeyword(searchParams.get('keyword'));

    setTargetType((prev) => (prev === nextTargetType ? prev : nextTargetType));
    setIsRead((prev) => (prev === nextIsRead ? prev : nextIsRead));
    setKeyword((prev) => (prev === nextKeyword ? prev : nextKeyword));
    setKeywordInput((prev) => (prev === nextKeyword ? prev : nextKeyword));
  }, [searchParams]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (targetType) {
      params.set('targetType', targetType);
    }
    if (isRead !== 'all') {
      params.set('isRead', isRead);
    }
    if (keyword) {
      params.set('keyword', keyword);
    }
    return params.toString();
  }, [isRead, keyword, targetType]);

  useEffect(() => {
    if (queryString === searchParams.toString()) {
      return;
    }
    setSearchParams(queryString ? new URLSearchParams(queryString) : new URLSearchParams(), { replace: true });
  }, [queryString, searchParams, setSearchParams]);

  const columns: ColumnsType<NotificationRow> = useMemo(
    () => [
      {
        title: '通知类型',
        dataIndex: 'targetType',
        width: 140,
        render: (value: string) => {
          const label = targetTypeLabelMap[value] ?? value ?? '系统通知';
          return <Tag color={value === 'ip_protection_alert' ? 'orange' : 'blue'}>{label}</Tag>;
        }
      },
      {
        title: '接收人',
        dataIndex: 'recipientName',
        width: 120
      },
      {
        title: '发送方',
        dataIndex: 'senderName',
        width: 120
      },
      {
        title: '内容',
        dataIndex: 'content',
        ellipsis: true
      },
      {
        title: '状态',
        dataIndex: 'isRead',
        width: 100,
        render: (value: boolean) => (
          <Tag color={value ? 'default' : 'green'}>{value ? '已读' : '未读'}</Tag>
        )
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        width: 180
      },
      {
        title: '操作',
        width: 150,
        render: (_unused, record) => (
          <Space size={8}>
            <Button
              type="link"
              disabled={record.isRead}
              onClick={async () => {
                try {
                  await adminOperationsApi.markNotificationRead(record.id);
                  message.success('已标记通知已读');
                  await fetchData(page, limit);
                } catch (err) {
                  message.error(getErrorMessage(err, '标记已读失败'));
                }
              }}
            >
              标记已读
            </Button>
            <Popconfirm
              title="确认删除该通知？"
              okText="确认"
              cancelText="取消"
              onConfirm={async () => {
                try {
                  await adminOperationsApi.removeNotification(record.id);
                  message.success('通知已删除');
                  await fetchData(page, limit);
                } catch (err) {
                  message.error(getErrorMessage(err, '删除通知失败'));
                }
              }}
            >
              <Button type="link" danger>
                删除
              </Button>
            </Popconfirm>
          </Space>
        )
      }
    ],
    [fetchData, limit, page]
  );

  return (
    <Card
      title="系统通知中心"
      loading={loading}
      extra={
        <Space size={8}>
          <Button
            loading={markAllLoading}
            onClick={async () => {
              setMarkAllLoading(true);
              try {
                await adminOperationsApi.markAllNotificationsRead();
                message.success('全部通知已标记已读');
                await fetchData(page, limit);
              } catch (err) {
                message.error(getErrorMessage(err, '全部标记已读失败'));
              } finally {
                setMarkAllLoading(false);
              }
            }}
          >
            全部标记已读
          </Button>
          <Button onClick={() => void fetchData(page, limit)} disabled={loading}>
            刷新
          </Button>
        </Space>
      }
    >
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <Space size={8} style={{ marginBottom: 12, width: '100%' }} wrap>
        <Select
          value={targetType}
          options={targetTypeOptions}
          style={{ width: 180 }}
          onChange={(value) => {
            setTargetType(normalizeTargetType(String(value)));
            setPage(1);
          }}
        />
        <Select
          value={isRead}
          options={isReadOptions}
          style={{ width: 140 }}
          onChange={(value) => {
            setIsRead(normalizeReadStatus(String(value)));
            setPage(1);
          }}
        />
        <Input
          allowClear
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
          placeholder="搜索通知内容"
          style={{ width: 260 }}
        />
        <Button
          type="primary"
          onClick={() => {
            setKeyword(normalizeKeyword(keywordInput));
            setPage(1);
          }}
        >
          查询
        </Button>
        <Tag color="blue">
          当前筛选：{targetTypeLabelMap[targetType] ?? '全部类型'} / {isReadLabelMap[isRead] ?? '全部状态'}
        </Tag>
      </Space>
      <Table<NotificationRow>
        rowKey="key"
        dataSource={rows}
        columns={columns}
        pagination={{
          current: page,
          pageSize: limit,
          total,
          showSizeChanger: true,
          showTotal: (value) => `共 ${value} 条`,
          onChange: (nextPage, nextPageSize) => {
            void fetchData(nextPage, nextPageSize);
          }
        }}
        scroll={{ x: 980 }}
      />
    </Card>
  );
};

export default SystemNotificationsPage;
