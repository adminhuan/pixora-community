import { useState } from 'react';
import { Alert, Button, Card, DatePicker, Form, Input, Select, Space } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { adminAnalyticsApi } from '../../api/admin';
import { extractData, getErrorMessage } from '../../utils/api';

const ReportExportPage = () => {
  const [format, setFormat] = useState('csv');
  const [email, setEmail] = useState('');
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>([dayjs().subtract(7, 'day'), dayjs()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  return (
    <Card title="报表导出">
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      {result && (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 12 }}
          message={`导出任务已创建：${String(result.taskId ?? '-')}`}
          description={`格式：${String(result.format ?? format)}，状态：${String(result.status ?? 'queued')}`}
        />
      )}
      <Form layout="vertical">
        <Space direction="vertical" style={{ width: '100%' }}>
          <DatePicker.RangePicker
            value={range}
            onChange={(value) => {
              if (value && value[0] && value[1]) {
                setRange([value[0], value[1]]);
              } else {
                setRange(null);
              }
            }}
          />
          <Select
            value={format}
            onChange={setFormat}
            options={[
              { label: 'CSV', value: 'csv' },
              { label: 'Excel', value: 'xlsx' },
              { label: 'PDF', value: 'pdf' },
            ]}
          />
          <Input placeholder="接收邮箱（可选）" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Button
            type="primary"
            loading={loading}
            onClick={async () => {
              setLoading(true);
              setError('');
              setResult(null);

              try {
                const response = await adminAnalyticsApi.export({
                  format,
                  email: email.trim() || undefined,
                  startAt: range?.[0]?.toISOString(),
                  endAt: range?.[1]?.toISOString(),
                });

                setResult(extractData<Record<string, unknown> | null>(response, null));
              } catch (err) {
                setError(getErrorMessage(err, '报表导出失败'));
              } finally {
                setLoading(false);
              }
            }}
          >
            导出报表
          </Button>
        </Space>
      </Form>
    </Card>
  );
};

export default ReportExportPage;
