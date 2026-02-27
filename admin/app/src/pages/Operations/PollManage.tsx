import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Divider, Input, Space, Switch, Table, Tag } from 'antd';
import { adminOperationsApi } from '../../api/admin';
import { extractData, getErrorMessage } from '../../utils/api';

interface PollOptionRow {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
  voteCount: number;
}

interface PollConfigPayload {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  totalVotes: number;
  options: PollOptionRow[];
}

const createDraftOption = (index: number): PollOptionRow => ({
  id: `custom_${Date.now()}_${index}`,
  label: '',
  enabled: true,
  order: index + 1,
  voteCount: 0
});

const parsePollConfig = (payload: unknown): PollConfigPayload => {
  const data = extractData<Record<string, unknown>>(payload, {});
  const options = Array.isArray(data.options) ? data.options : [];

  return {
    id: String(data.id ?? ''),
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    enabled: Boolean(data.enabled),
    totalVotes: Number(data.totalVotes ?? 0),
    options: options.map((item, index) => {
      const source = item as Record<string, unknown>;
      return {
        id: String(source.id ?? `opt_${index + 1}`),
        label: String(source.label ?? ''),
        enabled: Boolean(source.enabled),
        order: Number(source.order ?? index + 1),
        voteCount: Number(source.voteCount ?? 0)
      };
    })
  };
};

const PollManagePage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [config, setConfig] = useState<PollConfigPayload>({
    id: '',
    title: '',
    description: '',
    enabled: true,
    totalVotes: 0,
    options: []
  });

  const fetchConfig = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminOperationsApi.pollConfig();
      setConfig(parsePollConfig(response));
    } catch (requestError) {
      setError(getErrorMessage(requestError, '投票配置加载失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchConfig();
  }, []);

  const sortedOptions = useMemo(() => {
    return [...config.options].sort((left, right) => left.order - right.order);
  }, [config.options]);

  const updateOption = (id: string, patch: Partial<PollOptionRow>) => {
    setConfig((previous) => ({
      ...previous,
      options: previous.options.map((item) => (item.id === id ? { ...item, ...patch } : item))
    }));
  };

  return (
    <Card title="论坛投票配置" loading={loading}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      {success && <Alert type="success" showIcon message={success} style={{ marginBottom: 12 }} />}

      <Space direction="vertical" style={{ width: '100%' }} size={14}>
        <Input
          value={config.title}
          placeholder="投票标题"
          onChange={(event) => setConfig((previous) => ({ ...previous, title: event.target.value }))}
        />
        <Input.TextArea
          rows={2}
          value={config.description}
          placeholder="投票描述"
          onChange={(event) => setConfig((previous) => ({ ...previous, description: event.target.value }))}
        />
        <Space>
          <span>投票开关</span>
          <Switch
            checked={config.enabled}
            onChange={(checked) => setConfig((previous) => ({ ...previous, enabled: checked }))}
          />
          <Tag color={config.enabled ? 'green' : 'default'}>{config.enabled ? '已启用' : '已停用'}</Tag>
          <Tag color="blue">{`总票数 ${config.totalVotes}`}</Tag>
        </Space>
      </Space>

      <Divider />

      <Space style={{ marginBottom: 12 }}>
        <Button
          type="dashed"
          onClick={() => {
            setConfig((previous) => ({
              ...previous,
              options: [
                ...previous.options,
                createDraftOption(previous.options.length)
              ].map((item, index) => ({ ...item, order: index + 1 }))
            }));
          }}
        >
          新增选项
        </Button>
      </Space>

      <Table
        rowKey={(record) => record.id}
        pagination={false}
        dataSource={sortedOptions}
        columns={[
          {
            title: '排序',
            width: 80,
            render: (_unused: unknown, _record: PollOptionRow, index: number) => index + 1
          },
          {
            title: '选项名称',
            render: (_unused: unknown, record: PollOptionRow) => (
              <Input
                value={record.label}
                placeholder="请输入投票选项"
                onChange={(event) => updateOption(record.id, { label: event.target.value })}
              />
            )
          },
          {
            title: '启用',
            width: 100,
            render: (_unused: unknown, record: PollOptionRow) => (
              <Switch checked={record.enabled} onChange={(checked) => updateOption(record.id, { enabled: checked })} />
            )
          },
          {
            title: '得票',
            width: 90,
            render: (_unused: unknown, record: PollOptionRow) => record.voteCount
          },
          {
            title: '操作',
            width: 220,
            render: (_unused: unknown, record: PollOptionRow, index: number) => (
              <Space>
                <Button
                  type="link"
                  disabled={index === 0}
                  onClick={() => {
                    if (index === 0) return;
                    setConfig((previous) => {
                      const next = [...previous.options].sort((left, right) => left.order - right.order);
                      [next[index - 1], next[index]] = [next[index], next[index - 1]];
                      return {
                        ...previous,
                        options: next.map((item, itemIndex) => ({ ...item, order: itemIndex + 1 }))
                      };
                    });
                  }}
                >
                  上移
                </Button>
                <Button
                  type="link"
                  disabled={index === sortedOptions.length - 1}
                  onClick={() => {
                    if (index === sortedOptions.length - 1) return;
                    setConfig((previous) => {
                      const next = [...previous.options].sort((left, right) => left.order - right.order);
                      [next[index], next[index + 1]] = [next[index + 1], next[index]];
                      return {
                        ...previous,
                        options: next.map((item, itemIndex) => ({ ...item, order: itemIndex + 1 }))
                      };
                    });
                  }}
                >
                  下移
                </Button>
                <Button
                  type="link"
                  danger
                  onClick={() => {
                    setConfig((previous) => {
                      const next = previous.options.filter((item) => item.id !== record.id);
                      return {
                        ...previous,
                        options: next.map((item, itemIndex) => ({ ...item, order: itemIndex + 1 }))
                      };
                    });
                  }}
                >
                  删除
                </Button>
              </Space>
            )
          }
        ]}
      />

      <Divider />

      <Space>
        <Button
          type="primary"
          loading={saving}
          onClick={async () => {
            const options = sortedOptions
              .map((item, index) => ({
                id: item.id,
                label: item.label.trim(),
                enabled: item.enabled,
                order: index + 1
              }))
              .filter((item) => item.label);

            if (options.length < 2) {
              setError('至少保留两个有效投票选项');
              return;
            }

            setSaving(true);
            setError('');
            setSuccess('');

            try {
              const response = await adminOperationsApi.updatePollConfig({
                title: config.title.trim(),
                description: config.description.trim(),
                enabled: config.enabled,
                options
              });
              setConfig(parsePollConfig(response));
              setSuccess('投票配置已保存');
            } catch (requestError) {
              setError(getErrorMessage(requestError, '投票配置保存失败'));
            } finally {
              setSaving(false);
            }
          }}
        >
          保存配置
        </Button>
        <Button onClick={() => void fetchConfig()}>刷新</Button>
      </Space>
    </Card>
  );
};

export default PollManagePage;
