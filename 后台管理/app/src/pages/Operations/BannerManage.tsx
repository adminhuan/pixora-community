import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Form, Input, InputNumber, Space, Table } from 'antd';
import { adminOperationsApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';
import { openTextInputModal } from '../../utils/modal-input';

const BannerManagePage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [order, setOrder] = useState(1);
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);

  const fetchBanners = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminOperationsApi.banners();
      setData(extractList<Record<string, unknown>>(response));
    } catch (err) {
      setError(getErrorMessage(err, 'Banner 列表加载失败'));
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBanners();
  }, []);

  const sorted = useMemo(
    () => [...data].sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)),
    [data],
  );

  return (
    <Card title="Banner 管理" loading={loading}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <Form layout="vertical">
        <Form.Item label="Banner 标题">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </Form.Item>
        <Form.Item label="图片链接">
          <Input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://..." />
        </Form.Item>
        <Form.Item label="排序">
          <InputNumber min={1} value={order} onChange={(value) => setOrder(Number(value ?? 1))} />
        </Form.Item>
        <Button
          type="primary"
          loading={saving}
          onClick={async () => {
            if (!title.trim()) {
              return;
            }

            setSaving(true);
            setError('');

            try {
              await adminOperationsApi.createBanner({ title: title.trim(), imageUrl: imageUrl.trim(), order });
              setTitle('');
              setImageUrl('');
              setOrder(1);
              await fetchBanners();
            } catch (err) {
              setError(getErrorMessage(err, 'Banner 创建失败'));
            } finally {
              setSaving(false);
            }
          }}
        >
          新增 Banner
        </Button>
      </Form>
      <Table
        style={{ marginTop: 16 }}
        rowKey={(record) => String(record.id ?? '')}
        columns={[
          { title: '标题', dataIndex: 'title' },
          { title: '图片链接', dataIndex: 'imageUrl' },
          { title: '排序', dataIndex: 'order' },
          { title: '创建时间', dataIndex: 'createdAt' },
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

                    const nextOrder = await openTextInputModal({
                      title: '更新排序',
                      initialValue: String(record.order ?? 1),
                      placeholder: '请输入大于 0 的整数',
                      requiredMessage: '请输入排序值',
                    });
                    if (nextOrder === null) {
                      return;
                    }

                    const parsedOrder = Number(nextOrder);
                    if (!Number.isInteger(parsedOrder) || parsedOrder <= 0) {
                      setError('排序必须是大于 0 的整数');
                      return;
                    }

                    try {
                      await adminOperationsApi.updateBanner(id, {
                        title: String(record.title ?? ''),
                        imageUrl: String(record.imageUrl ?? ''),
                        order: parsedOrder,
                      });
                      await fetchBanners();
                    } catch (err) {
                      setError(getErrorMessage(err, 'Banner 更新失败'));
                    }
                  }}
                >
                  更新排序
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
                      await adminOperationsApi.deleteBanner(id);
                      await fetchBanners();
                    } catch (err) {
                      setError(getErrorMessage(err, 'Banner 删除失败'));
                    }
                  }}
                >
                  删除
                </Button>
              </Space>
            ),
          },
        ]}
        dataSource={sorted}
      />
    </Card>
  );
};

export default BannerManagePage;
