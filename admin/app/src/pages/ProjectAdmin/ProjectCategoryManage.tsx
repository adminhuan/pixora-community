import { useEffect, useState } from 'react';
import { Alert, Button, Card, Space, Table } from 'antd';
import { adminProjectApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';
import { openTextInputModal } from '../../utils/modal-input';

const ProjectCategoryManagePage = () => {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminProjectApi.categories();
      setData(extractList<Record<string, unknown>>(response));
    } catch (err) {
      setError(getErrorMessage(err, '项目分类加载失败'));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCategories();
  }, []);

  return (
    <Card
      title="项目分类管理"
      loading={loading}
      extra={
        <Button
          loading={actionLoading}
          onClick={async () => {
            const name = await openTextInputModal({
              title: '新增项目分类',
              placeholder: '请输入分类名称',
              requiredMessage: '分类名称不能为空',
            });
            if (name === null) {
              return;
            }

            setActionLoading(true);
            setError('');

            try {
              await adminProjectApi.createCategory({ name });
              await fetchCategories();
            } catch (err) {
              setError(getErrorMessage(err, '项目分类创建失败'));
            } finally {
              setActionLoading(false);
            }
          }}
        >
          新增分类
        </Button>
      }
    >
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <Table
        rowKey={(record) => String(record.id ?? '')}
        columns={[
          { title: '分类名称', dataIndex: 'name' },
          { title: '项目数量', dataIndex: 'count' },
          {
            title: '操作',
            render: (_unused: unknown, record: Record<string, unknown>) => (
              <Space>
                <Button
                  type="link"
                  onClick={async () => {
                    const id = String(record.id ?? '');
                    if (!id) {
                      return;
                    }

                    const nextName = await openTextInputModal({
                      title: '编辑项目分类',
                      initialValue: String(record.name ?? ''),
                      placeholder: '请输入新的分类名称',
                      requiredMessage: '分类名称不能为空',
                    });
                    if (nextName === null) {
                      return;
                    }

                    try {
                      await adminProjectApi.updateCategory(id, { name: nextName });
                      await fetchCategories();
                    } catch (err) {
                      setError(getErrorMessage(err, '项目分类更新失败'));
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
                      await adminProjectApi.deleteCategory(id);
                      await fetchCategories();
                    } catch (err) {
                      setError(getErrorMessage(err, '项目分类删除失败'));
                    }
                  }}
                >
                  删除
                </Button>
              </Space>
            )
          }
        ]}
        dataSource={data}
        pagination={false}
      />
    </Card>
  );
};

export default ProjectCategoryManagePage;
