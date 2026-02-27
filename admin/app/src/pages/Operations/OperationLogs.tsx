import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Space } from 'antd';
import { adminOperationsApi } from '../../api/admin';
import { extractList, extractPagination, getErrorMessage } from '../../utils/api';
import { LogTable } from './components/LogTable';

const OperationLogsPage = () => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      setError('');

      try {
        const response = await adminOperationsApi.logs({ page: nextPage, limit });
        const pagination = extractPagination(response);
        const list = extractList<Record<string, unknown>>(response).map((item) => ({
          key: String(item.id ?? ''),
          operator: String(item.operator ?? '-'),
          action: String(item.action ?? item.method ?? '-'),
          target: String(item.target ?? item.path ?? '-'),
          statusCode: Number(item.statusCode ?? 0),
          durationMs: Number(item.durationMs ?? 0),
          time: String(item.createdAt ?? item.time ?? '-'),
        }));

        setData(list.filter((item) => item.key));
        setTotal(Number(pagination?.total ?? list.length));
        setPage(nextPage);
      } catch (err) {
        setError(getErrorMessage(err, '操作日志加载失败'));
        setData([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [limit],
  );

  useEffect(() => {
    void fetchLogs(1);
  }, [fetchLogs]);

  return (
    <Card
      title="操作日志"
      loading={loading}
      extra={
        <Space>
          <Button
            loading={exporting}
            onClick={async () => {
              setExporting(true);
              setError('');

              try {
                await adminOperationsApi.exportLogs({ format: 'csv' });
              } catch (err) {
                setError(getErrorMessage(err, '日志导出失败'));
              } finally {
                setExporting(false);
              }
            }}
          >
            导出日志
          </Button>
        </Space>
      }
    >
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <LogTable data={data} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <span style={{ color: 'var(--admin-text-secondary)' }}>共 {total} 条</span>
        <Space>
          <Button disabled={page <= 1 || loading} onClick={() => void fetchLogs(page - 1)}>
            上一页
          </Button>
          <span style={{ minWidth: 72, textAlign: 'center' }}>第 {page} 页</span>
          <Button disabled={page * limit >= total || loading} onClick={() => void fetchLogs(page + 1)}>
            下一页
          </Button>
        </Space>
      </div>
    </Card>
  );
};

export default OperationLogsPage;
