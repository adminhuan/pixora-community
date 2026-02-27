import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Space, Switch, Table, message } from 'antd';
import { adminForumApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';
import { openTextInputModal } from '../../utils/modal-input';

interface CategoryNode {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  type: string;
  parentId?: string | null;
  children?: CategoryNode[];
}

interface CategoryRow {
  id: string;
  key: string;
  name: string;
  order: number;
  isActive: boolean;
  type: string;
  parentId: string;
  parentName: string;
  depth: number;
}

const flattenCategories = (nodes: CategoryNode[], parentName = '', depth = 0): CategoryRow[] => {
  return nodes.flatMap((node) => {
    const current: CategoryRow = {
      id: node.id,
      key: node.id,
      name: node.name,
      order: Number(node.order ?? 0),
      isActive: Boolean(node.isActive),
      type: String(node.type ?? 'post'),
      parentId: String(node.parentId ?? ''),
      parentName,
      depth,
    };

    const children = Array.isArray(node.children)
      ? flattenCategories(node.children as CategoryNode[], node.name, depth + 1)
      : [];

    return [current, ...children];
  });
};

const CategoryManagePage = () => {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [savingSort, setSavingSort] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<CategoryRow[]>([]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminForumApi.categories();
      const tree = extractList<CategoryNode>(response);
      const flattened = flattenCategories(tree)
        .filter((item) => item.type === 'post')
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
      setData(flattened);
    } catch (err) {
      setError(getErrorMessage(err, '分类列表加载失败'));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const orderMap = useMemo(() => new Map(data.map((item, index) => [item.id, index])), [data]);

  const moveCategory = (id: string, offset: -1 | 1) => {
    const index = orderMap.get(id);
    if (index === undefined) {
      return;
    }
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= data.length) {
      return;
    }

    const nextData = [...data];
    const [item] = nextData.splice(index, 1);
    nextData.splice(nextIndex, 0, item);
    setData(
      nextData.map((row, rowIndex) => ({
        ...row,
        order: rowIndex + 1,
      })),
    );
  };

  return (
    <Card
      title="分类管理"
      loading={loading}
      extra={
        <Space>
          <Button
            loading={savingSort}
            disabled={!data.length}
            onClick={async () => {
              setSavingSort(true);
              setError('');
              try {
                await adminForumApi.sortCategories({
                  items: data.map((item, index) => ({ id: item.id, order: index + 1 })),
                });
                message.success('分类排序已保存');
                await fetchCategories();
              } catch (err) {
                setError(getErrorMessage(err, '分类排序保存失败'));
              } finally {
                setSavingSort(false);
              }
            }}
          >
            分类排序
          </Button>
          <Button
            type="primary"
            loading={actionLoading}
            onClick={async () => {
              const name = await openTextInputModal({
                title: '新增分类',
                placeholder: '请输入分类名称',
                requiredMessage: '分类名称不能为空',
              });
              if (name === null) {
                return;
              }

              setActionLoading(true);
              try {
                await adminForumApi.createCategory({
                  name,
                  order: data.length + 1,
                  isActive: true,
                  type: 'post',
                });
                message.success('新增分类成功');
                await fetchCategories();
              } catch (err) {
                setError(getErrorMessage(err, '新增分类失败'));
              } finally {
                setActionLoading(false);
              }
            }}
          >
            新增分类
          </Button>
        </Space>
      }
    >
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <Table
        rowKey={(record) => String(record.id ?? '')}
        columns={[
          {
            title: '分类',
            dataIndex: 'name',
            render: (value: string, record: CategoryRow) =>
              `${record.depth > 0 ? `${'— '.repeat(record.depth)}` : ''}${value}`,
          },
          { title: '上级分类', dataIndex: 'parentName', render: (value: string) => value || '顶级' },
          { title: '排序', dataIndex: 'order' },
          {
            title: '启用',
            dataIndex: 'isActive',
            render: (value: boolean, record: CategoryRow) => (
              <Switch
                checked={Boolean(value)}
                loading={actionLoading}
                onChange={async (checked) => {
                  setActionLoading(true);
                  setError('');
                  try {
                    await adminForumApi.updateCategory(record.id, { isActive: checked });
                    message.success('分类状态已更新');
                    await fetchCategories();
                  } catch (err) {
                    setError(getErrorMessage(err, '分类状态更新失败'));
                  } finally {
                    setActionLoading(false);
                  }
                }}
              />
            ),
          },
          {
            title: '操作',
            render: (_unused: unknown, record: CategoryRow) => (
              <Space>
                <Button size="small" onClick={() => moveCategory(record.id, -1)} disabled={(orderMap.get(record.id) ?? 0) <= 0}>
                  上移
                </Button>
                <Button
                  size="small"
                  onClick={() => moveCategory(record.id, 1)}
                  disabled={(orderMap.get(record.id) ?? 0) >= data.length - 1}
                >
                  下移
                </Button>
                <Button
                  type="link"
                  loading={actionLoading}
                  onClick={async () => {
                    const id = String(record.id);
                    if (!id) {
                      return;
                    }

                    const name = await openTextInputModal({
                      title: '编辑分类',
                      initialValue: String(record.name),
                      placeholder: '请输入分类名称',
                      requiredMessage: '分类名称不能为空',
                    });
                    if (name === null) {
                      return;
                    }

                    setActionLoading(true);
                    try {
                      await adminForumApi.updateCategory(id, { name });
                      message.success('分类更新成功');
                      await fetchCategories();
                    } catch (err) {
                      setError(getErrorMessage(err, '分类更新失败'));
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                >
                  编辑
                </Button>
                <Button
                  type="link"
                  danger
                  loading={actionLoading}
                  onClick={async () => {
                    const id = String(record.id);
                    if (!id) {
                      return;
                    }

                    setActionLoading(true);
                    try {
                      await adminForumApi.deleteCategory(id);
                      message.success('分类删除成功');
                      await fetchCategories();
                    } catch (err) {
                      setError(getErrorMessage(err, '分类删除失败'));
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                >
                  删除
                </Button>
              </Space>
            ),
          },
        ]}
        dataSource={data}
        pagination={false}
      />
    </Card>
  );
};

export default CategoryManagePage;
