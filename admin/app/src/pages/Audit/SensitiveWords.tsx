import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Select, Space, Switch, Table, Tag } from 'antd';
import { adminAuditApi } from '../../api/admin';
import { extractData, extractList, getErrorMessage } from '../../utils/api';
import { openTextInputModal } from '../../utils/modal-input';

type SensitiveWordItem = {
  id: string;
  word: string;
  group: string;
  enabled: boolean;
  createdAt: string;
};

type SensitiveWordGroupItem = {
  group: string;
  enabled: boolean;
  total: number;
  active: number;
};

const GROUP_OPTIONS = [
  { label: '广告诈骗', value: 'ad-fraud' },
  { label: '涉黄低俗', value: 'adult' },
  { label: '博彩赌博', value: 'gambling' },
  { label: '违禁交易', value: 'illegal-trade' },
  { label: '违法犯罪', value: 'crime' },
  { label: '自定义', value: 'custom' },
];

const normalizeGroupValue = (value: string, customGroup: string): string => {
  if (value === 'custom') {
    const next = customGroup.trim().toLowerCase();
    return next || 'custom';
  }
  return value;
};

const SensitiveWordsPage = () => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [groupSubmitting, setGroupSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [word, setWord] = useState('');
  const [groupType, setGroupType] = useState<string>('ad-fraud');
  const [customGroup, setCustomGroup] = useState('');
  const [data, setData] = useState<SensitiveWordItem[]>([]);
  const [groups, setGroups] = useState<SensitiveWordGroupItem[]>([]);
  const [whitelistText, setWhitelistText] = useState('');
  const [whitelistSubmitting, setWhitelistSubmitting] = useState(false);

  const selectedGroup = useMemo(() => normalizeGroupValue(groupType, customGroup), [groupType, customGroup]);

  const parseWordRows = (payload: unknown): SensitiveWordItem[] =>
    extractList<Record<string, unknown>>(payload).map((item) => ({
      id: String(item.id ?? ''),
      word: String(item.word ?? ''),
      group: String(item.group ?? 'custom'),
      enabled: Boolean(item.enabled),
      createdAt: String(item.createdAt ?? ''),
    }));

  const parseGroupRows = (payload: unknown): SensitiveWordGroupItem[] =>
    extractList<Record<string, unknown>>(payload).map((item) => ({
      group: String(item.group ?? 'custom'),
      enabled: Boolean(item.enabled),
      total: Number(item.total ?? 0),
      active: Number(item.active ?? 0),
    }));

  const parseWhitelistRows = (payload: unknown): string[] => {
    const data = extractData<Record<string, unknown>>(payload, {});
    const words = Array.isArray(data.words) ? data.words : [];
    return words.map((item) => String(item).trim()).filter(Boolean);
  };

  const fetchGroups = async () => {
    const response = await adminAuditApi.sensitiveWordGroups();
    setGroups(parseGroupRows(response));
  };

  const fetchWords = async () => {
    setLoading(true);
    setError('');

    try {
      const [wordsRes, groupsRes, whitelistRes] = await Promise.all([
        adminAuditApi.sensitiveWords(),
        adminAuditApi.sensitiveWordGroups(),
        adminAuditApi.sensitiveWordWhitelist(),
      ]);
      setData(parseWordRows(wordsRes));
      setGroups(parseGroupRows(groupsRes));
      setWhitelistText(parseWhitelistRows(whitelistRes).join('\n'));
    } catch (err) {
      setError(getErrorMessage(err, '敏感词列表加载失败'));
      setData([]);
      setGroups([]);
      setWhitelistText('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchWords();
  }, []);

  return (
    <Card title="敏感词管理" loading={loading}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <Space style={{ marginBottom: 12 }}>
        <Input placeholder="输入敏感词" value={word} onChange={(event) => setWord(event.target.value)} />
        <Select
          value={groupType}
          style={{ width: 150 }}
          options={GROUP_OPTIONS}
          onChange={(value) => setGroupType(String(value))}
        />
        {groupType === 'custom' ? (
          <Input
            style={{ width: 160 }}
            placeholder="自定义分组"
            value={customGroup}
            onChange={(event) => setCustomGroup(event.target.value)}
          />
        ) : null}
        <Button
          type="primary"
          loading={submitting}
          onClick={async () => {
            const value = word.trim();
            if (!value) {
              return;
            }

            setSubmitting(true);
            setError('');

            try {
              await adminAuditApi.createSensitiveWord({ word: value, group: selectedGroup, enabled: true });
              setWord('');
              await fetchWords();
            } catch (err) {
              setError(getErrorMessage(err, '敏感词添加失败'));
            } finally {
              setSubmitting(false);
            }
          }}
        >
          添加
        </Button>
        <Button
          onClick={async () => {
            const text = await openTextInputModal({
              title: '导入敏感词词库',
              placeholder: '请输入敏感词列表，支持逗号或换行分隔',
              multiline: true,
              rows: 5,
              requiredMessage: '请至少输入一个敏感词',
            });
            if (text === null) {
              return;
            }

            const words = text
              .split(/[，,\n]/)
              .map((item) => item.trim())
              .filter(Boolean);

            if (!words.length) {
              return;
            }

            setSubmitting(true);
            setError('');

            try {
              await adminAuditApi.importSensitiveWords({ words, group: selectedGroup, enabled: true });
              await fetchWords();
            } catch (err) {
              setError(getErrorMessage(err, '敏感词导入失败'));
            } finally {
              setSubmitting(false);
            }
          }}
        >
          导入词库
        </Button>
        <Button
          loading={groupSubmitting}
          onClick={async () => {
            if (!groups.length) return;
            setGroupSubmitting(true);
            setError('');
            try {
              await Promise.all(
                groups.map((item) => adminAuditApi.toggleSensitiveWordGroup(item.group, { enabled: true })),
              );
              await fetchWords();
            } catch (err) {
              setError(getErrorMessage(err, '批量启用分组失败'));
            } finally {
              setGroupSubmitting(false);
            }
          }}
        >
          全部分组启用
        </Button>
        <Button
          danger
          loading={groupSubmitting}
          onClick={async () => {
            if (!groups.length) return;
            setGroupSubmitting(true);
            setError('');
            try {
              await Promise.all(
                groups.map((item) => adminAuditApi.toggleSensitiveWordGroup(item.group, { enabled: false })),
              );
              await fetchWords();
            } catch (err) {
              setError(getErrorMessage(err, '批量停用分组失败'));
            } finally {
              setGroupSubmitting(false);
            }
          }}
        >
          全部分组停用
        </Button>
      </Space>
      <Card size="small" title="白名单（防误杀）" style={{ marginBottom: 12 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input.TextArea
            rows={4}
            placeholder="按行或逗号分隔，例如：开元棋牌, 安全测试"
            value={whitelistText}
            onChange={(event) => setWhitelistText(event.target.value)}
          />
          <Space>
            <Button
              type="primary"
              loading={whitelistSubmitting}
              onClick={async () => {
                const words = whitelistText
                  .split(/[\n\r,，;；|]/)
                  .map((item) => item.trim())
                  .filter(Boolean);

                setWhitelistSubmitting(true);
                setError('');
                try {
                  await adminAuditApi.updateSensitiveWordWhitelist({ words });
                  await fetchWords();
                } catch (err) {
                  setError(getErrorMessage(err, '白名单保存失败'));
                } finally {
                  setWhitelistSubmitting(false);
                }
              }}
            >
              保存白名单
            </Button>
            <Button onClick={() => setWhitelistText('')}>清空编辑框</Button>
          </Space>
        </Space>
      </Card>
      <Table
        rowKey={(record) => record.group}
        size="small"
        pagination={false}
        style={{ marginBottom: 12 }}
        dataSource={groups}
        columns={[
          { title: '分组', dataIndex: 'group' },
          { title: '总词数', dataIndex: 'total', width: 100 },
          { title: '生效词数', dataIndex: 'active', width: 100 },
          {
            title: '状态',
            width: 120,
            render: (_unused: unknown, record: SensitiveWordGroupItem) => (
              <Tag color={record.enabled ? 'green' : 'default'}>{record.enabled ? '启用' : '停用'}</Tag>
            ),
          },
          {
            title: '一键开关',
            width: 160,
            render: (_unused: unknown, record: SensitiveWordGroupItem) => (
              <Switch
                checked={record.enabled}
                loading={groupSubmitting}
                onChange={async (checked) => {
                  setGroupSubmitting(true);
                  setError('');
                  try {
                    await adminAuditApi.toggleSensitiveWordGroup(record.group, { enabled: checked });
                    await fetchGroups();
                    await fetchWords();
                  } catch (err) {
                    setError(getErrorMessage(err, '分组状态更新失败'));
                  } finally {
                    setGroupSubmitting(false);
                  }
                }}
              />
            ),
          },
        ]}
      />
      <Table
        rowKey={(record) => record.id || record.word}
        columns={[
          { title: '敏感词', dataIndex: 'word' },
          {
            title: '分组',
            dataIndex: 'group',
            width: 140,
            render: (value: string) => <Tag>{value}</Tag>,
          },
          {
            title: '状态',
            width: 120,
            render: (_unused: unknown, record: SensitiveWordItem) => (
              <Tag color={record.enabled ? 'green' : 'default'}>{record.enabled ? '生效' : '停用'}</Tag>
            ),
          },
          {
            title: '创建时间',
            render: (_unused: unknown, record: SensitiveWordItem) => record.createdAt || '-',
          },
          {
            title: '操作',
            render: (_unused: unknown, record: SensitiveWordItem) => (
              <Button
                danger
                type="link"
                onClick={async () => {
                  const targetId = record.id;
                  if (!targetId) {
                    return;
                  }

                  try {
                    await adminAuditApi.deleteSensitiveWord(targetId);
                    await fetchWords();
                  } catch (err) {
                    setError(getErrorMessage(err, '敏感词删除失败'));
                  }
                }}
              >
                删除
              </Button>
            ),
          },
        ]}
        dataSource={data}
      />
    </Card>
  );
};

export default SensitiveWordsPage;
