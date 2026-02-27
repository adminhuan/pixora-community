import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, InputNumber, Popconfirm, Space, Table, Tag } from 'antd';
import { adminOperationsApi } from '../../api/admin';
import { extractData, extractList, getErrorMessage } from '../../utils/api';

const readObject = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const DataBackupPage = () => {
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [restoringId, setRestoringId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [intervalHours, setIntervalHours] = useState(24);
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminOperationsApi.backupList();
      const list = extractList<Record<string, unknown>>(response).map((item) => ({
        ...item,
        key: String(item.id ?? ''),
        id: String(item.id ?? ''),
        name: String(item.name ?? '-'),
        size: String(item.size ?? '-'),
        createdAt: String(item.createdAt ?? '-'),
        status: String(item.status ?? '-'),
        backupType: String(item.backupType ?? '-'),
        lastRestoreAt: String(readObject(item.lastRestore).restoredAt ?? '-')
      }));

      setData(list);
    } catch (err) {
      setError(getErrorMessage(err, '备份记录加载失败'));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchHistory();
  }, []);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card
        title="数据备份"
        extra={
          <Space>
            <Button
              type="primary"
              loading={running}
              onClick={async () => {
                setRunning(true);
                setError('');
                setSuccess('');

                try {
                  await adminOperationsApi.createBackup();
                  setSuccess('备份任务已创建');
                  await fetchHistory();
                } catch (err) {
                  setError(getErrorMessage(err, '备份任务创建失败'));
                } finally {
                  setRunning(false);
                }
              }}
            >
              立即备份
            </Button>
          </Space>
        }
      >
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
        {success && <Alert type="success" showIcon message={success} style={{ marginBottom: 12 }} />}
        <Form layout="inline">
          <Form.Item label="备份周期（小时）">
            <InputNumber min={1} value={intervalHours} onChange={(value) => setIntervalHours(Number(value ?? 24))} />
          </Form.Item>
          <Button
            loading={scheduleSaving}
            onClick={async () => {
              setScheduleSaving(true);
              setError('');
              setSuccess('');

              try {
                const response = await adminOperationsApi.updateBackupSchedule({
                  enabled: true,
                  intervalHours
                });
                const data = extractData<Record<string, unknown>>(response, {});
                setSuccess(`备份计划已保存：每 ${String(data.intervalHours ?? intervalHours)} 小时执行一次`);
              } catch (err) {
                setError(getErrorMessage(err, '备份计划保存失败'));
              } finally {
                setScheduleSaving(false);
              }
            }}
          >
            保存计划
          </Button>
        </Form>
      </Card>
      <Card title="备份列表" loading={loading}>
        <Table
          rowKey="key"
          columns={[
            { title: '备份文件', dataIndex: 'name' },
            {
              title: '类型',
              render: (_unused: unknown, record: Record<string, unknown>) => {
                const type = String(record.backupType ?? '-');
                return <Tag color={type === 'pg_dump' ? 'blue' : 'gold'}>{type}</Tag>;
              }
            },
            { title: '大小', dataIndex: 'size' },
            { title: '状态', dataIndex: 'status' },
            { title: '创建时间', dataIndex: 'createdAt' },
            { title: '上次恢复', dataIndex: 'lastRestoreAt' },
            {
              title: '操作',
              render: (_unused: unknown, record: Record<string, unknown>) => (
                <Space size={4}>
                  <Button
                    type="link"
                    onClick={async () => {
                      const id = String(record.id ?? '');
                      const name = String(record.name ?? `backup-${id}.gz`);
                      if (!id) {
                        return;
                      }

                      try {
                        await adminOperationsApi.downloadBackup(id);
                        const blob = await adminOperationsApi.downloadBackupFile(id);
                        const blobUrl = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = name;
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        window.URL.revokeObjectURL(blobUrl);
                        setSuccess('备份文件下载成功');
                      } catch (err) {
                        setError(getErrorMessage(err, '下载备份文件失败'));
                      }
                    }}
                  >
                    下载
                  </Button>
                  <Popconfirm
                    title="确认执行恢复操作？"
                    description={
                      String(record.backupType ?? '') === 'json_snapshot'
                        ? '该备份类型当前执行结构校验，不会覆盖数据库。'
                        : '恢复将覆盖当前数据库数据，请确认环境与时机。'
                    }
                    okText="确认"
                    cancelText="取消"
                    onConfirm={async () => {
                      const id = String(record.id ?? '');
                      if (!id) {
                        return;
                      }

                      setRestoringId(id);
                      setError('');
                      setSuccess('');

                      try {
                        const response = await adminOperationsApi.restoreBackup(id);
                        const result = extractData<Record<string, unknown>>(response, {});
                        const message = String(result.message ?? '恢复操作已执行');
                        setSuccess(message);
                        await fetchHistory();
                      } catch (err) {
                        setError(getErrorMessage(err, '执行恢复失败'));
                      } finally {
                        setRestoringId('');
                      }
                    }}
                  >
                    <Button
                      type="link"
                      loading={restoringId === String(record.id ?? '')}
                      disabled={Boolean(restoringId)}
                    >
                      {String(record.backupType ?? '') === 'json_snapshot' ? '校验' : '恢复'}
                    </Button>
                  </Popconfirm>
                </Space>
              )
            }
          ]}
          dataSource={data}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default DataBackupPage;
