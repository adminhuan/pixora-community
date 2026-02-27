import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Modal, Select, Space, Table } from 'antd';
import { adminTagApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';
import { openTextInputModal } from '../../utils/modal-input';

const TagManagePage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [newTag, setNewTag] = useState('');
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);

  const fetchTags = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminTagApi.tags();
      setData(extractList<Record<string, unknown>>(response));
    } catch (err) {
      setError(getErrorMessage(err, '标签列表加载失败'));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTags();
  }, []);

  const filtered = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    if (!text) {
      return data;
    }

    return data.filter((item) => String(item.name ?? '').toLowerCase().includes(text));
  }, [data, keyword]);

  const options = data
    .map((item) => ({ value: String(item.id ?? ''), label: String(item.name ?? '') }))
    .filter((item) => item.value && item.label);

  return (
    <Card title="标签管理" loading={loading}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <Space style={{ marginBottom: 12 }}>
        <Input placeholder="搜索标签" style={{ width: 220 }} value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        <Input placeholder="新建标签" style={{ width: 180 }} value={newTag} onChange={(event) => setNewTag(event.target.value)} />
        <Button
          type="primary"
          onClick={async () => {
            const name = newTag.trim();
            if (!name) {
              return;
            }

            try {
              await adminTagApi.createTag({ name });
              setNewTag('');
              await fetchTags();
            } catch (err) {
              setError(getErrorMessage(err, '新建标签失败'));
            }
          }}
        >
          新建标签
        </Button>
        <Button onClick={() => setMergeOpen(true)} disabled={selectedIds.length < 2}>
          合并标签
        </Button>
      </Space>
      <Table
        rowKey={(record) => String(record.id ?? '')}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys.map((key) => String(key))),
        }}
        columns={[
          { title: '标签', dataIndex: 'name' },
          { title: '使用次数', dataIndex: 'usageCount' },
          { title: '创建时间', dataIndex: 'createdAt' },
          {
            title: '操作',
            render: (_unused: unknown, record: Record<string, unknown>) => (
              <Space>
                <Button
                  type="link"
                  onClick={async () => {
                    const id = String(record.id ?? '');
                    const currentName = String(record.name ?? '');
                    if (!id) {
                      return;
                    }

                    const name = await openTextInputModal({
                      title: '编辑标签',
                      initialValue: currentName,
                      placeholder: '请输入新标签名',
                      requiredMessage: '标签名称不能为空',
                    });
                    if (name === null) {
                      return;
                    }

                    try {
                      await adminTagApi.updateTag(id, { name });
                      await fetchTags();
                    } catch (err) {
                      setError(getErrorMessage(err, '标签更新失败'));
                    }
                  }}
                >
                  编辑
                </Button>
                <Button
                  type="link"
                  danger
                  onClick={async () => {
                    const id = String(record.id ?? '');
                    if (!id) {
                      return;
                    }

                    try {
                      await adminTagApi.deleteTag(id);
                      await fetchTags();
                    } catch (err) {
                      setError(getErrorMessage(err, '标签删除失败'));
                    }
                  }}
                >
                  删除
                </Button>
              </Space>
            ),
          },
        ]}
        dataSource={filtered}
      />
      <Modal
        open={mergeOpen}
        title="合并标签"
        onCancel={() => {
          setMergeOpen(false);
          setMergeTarget('');
        }}
        onOk={async () => {
          if (selectedIds.length < 2 || !mergeTarget) {
            return;
          }

          const fromId = selectedIds.find((id) => id !== mergeTarget) ?? '';
          if (!fromId) {
            return;
          }

          try {
            await adminTagApi.mergeTags({ fromId, toId: mergeTarget });
            setMergeOpen(false);
            setMergeTarget('');
            setSelectedIds([]);
            await fetchTags();
          } catch (err) {
            setError(getErrorMessage(err, '标签合并失败'));
          }
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select
            mode="multiple"
            placeholder="选择待合并标签"
            value={selectedIds}
            onChange={(value) => setSelectedIds(value)}
            options={options}
          />
          <Select
            placeholder="选择目标标签"
            value={mergeTarget || undefined}
            onChange={(value) => setMergeTarget(value)}
            options={options.filter((item) => selectedIds.includes(item.value))}
          />
        </Space>
      </Modal>
    </Card>
  );
};

export default TagManagePage;
