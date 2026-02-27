import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Space, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { adminTagApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';
import { openTextInputModal } from '../../utils/modal-input';

const mapToTreeNodes = (nodes: Array<Record<string, unknown>>): DataNode[] => {
  return nodes.map((node) => ({
    key: String(node.id ?? ''),
    title: String(node.name ?? '未命名分类'),
    children: Array.isArray(node.children) ? mapToTreeNodes(node.children as Array<Record<string, unknown>>) : undefined,
  }));
};

const CategoryTreeManagePage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);

  const fetchTree = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminTagApi.categoryTree();
      const list = extractList<Record<string, unknown>>(response);
      setData(list);

      const keys = list.map((item) => String(item.id ?? '')).filter(Boolean);
      setExpandedKeys(keys);
    } catch (err) {
      setError(getErrorMessage(err, '分类树加载失败'));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTree();
  }, []);

  const treeData = useMemo(() => mapToTreeNodes(data), [data]);

  return (
    <Card
      title="分类树管理"
      loading={loading}
      extra={
        <Space>
          <Button
            onClick={async () => {
              const name = await openTextInputModal({
                title: '新增分类',
                placeholder: '请输入分类名称',
                requiredMessage: '分类名称不能为空',
              });
              if (name === null) {
                return;
              }

              try {
                await adminTagApi.createCategory({ name, parentId: selectedKey || null });
                await fetchTree();
              } catch (err) {
                setError(getErrorMessage(err, '新增分类失败'));
              }
            }}
          >
            新增分类
          </Button>
          <Button
            disabled={!selectedKey}
            onClick={async () => {
              if (!selectedKey) {
                return;
              }

              const selected = data.find((item) => String(item.id ?? '') === selectedKey);
              const name = await openTextInputModal({
                title: '编辑分类',
                initialValue: String(selected?.name ?? ''),
                placeholder: '请输入新的分类名',
                requiredMessage: '分类名称不能为空',
              });
              if (name === null) {
                return;
              }

              try {
                await adminTagApi.updateCategory(selectedKey, { name });
                await fetchTree();
              } catch (err) {
                setError(getErrorMessage(err, '分类更新失败'));
              }
            }}
          >
            编辑分类
          </Button>
          <Button
            danger
            disabled={!selectedKey}
            onClick={async () => {
              if (!selectedKey) {
                return;
              }

              try {
                await adminTagApi.deleteCategory(selectedKey);
                setSelectedKey('');
                await fetchTree();
              } catch (err) {
                setError(getErrorMessage(err, '分类删除失败'));
              }
            }}
          >
            删除分类
          </Button>
        </Space>
      }
    >
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <Tree
        treeData={treeData}
        expandedKeys={expandedKeys}
        onExpand={(keys) => setExpandedKeys(keys.map((key) => String(key)))}
        selectedKeys={selectedKey ? [selectedKey] : []}
        onSelect={(keys) => setSelectedKey(String(keys[0] ?? ''))}
      />
    </Card>
  );
};

export default CategoryTreeManagePage;
