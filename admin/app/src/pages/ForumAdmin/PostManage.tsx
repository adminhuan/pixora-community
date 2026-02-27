import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Space, Table, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { adminForumApi } from '../../api/admin';
import { extractData, extractList, getErrorMessage } from '../../utils/api';
import { MovePostModal } from './components/MovePostModal';
import { PostFilters } from './components/PostFilters';

interface CategoryOption {
  label: string;
  value: string;
}

const flattenPostCategories = (items: Array<Record<string, unknown>>, prefix = ''): CategoryOption[] => {
  return items.flatMap((item) => {
    const id = String(item.id ?? '').trim();
    const name = String(item.name ?? '').trim();
    const type = String(item.type ?? '').trim();
    const label = prefix ? `${prefix} / ${name}` : name;
    const children = Array.isArray(item.children) ? (item.children as Array<Record<string, unknown>>) : [];

    const includeCurrent = id && name && (type ? type === 'post' : true);
    const current = includeCurrent ? [{ label, value: id }] : [];
    return [...current, ...flattenPostCategories(children, label)];
  });
};

const statusLabelMap: Record<string, string> = {
  published: '已发布',
  pending: '待审核',
  deleted: '已删除',
  draft: '草稿',
};

const statusColorMap: Record<string, string> = {
  published: 'blue',
  pending: 'gold',
  deleted: 'default',
  draft: 'default',
};

const PostManagePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([{ label: '全部分类', value: '' }]);

  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');

  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveTargetPostId, setMoveTargetPostId] = useState('');
  const [moveCategoryId, setMoveCategoryId] = useState('');

  const fetchPosts = async (withLoading = true) => {
    if (withLoading) {
      setLoading(true);
    }
    setError('');

    try {
      const response = await adminForumApi.posts();
      setData(extractList<Record<string, unknown>>(response));
    } catch (err) {
      setError(getErrorMessage(err, '帖子列表加载失败'));
      setData([]);
    } finally {
      if (withLoading) {
        setLoading(false);
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await adminForumApi.categories();
      const tree = extractData<Array<Record<string, unknown>>>(response, []);
      const categories = flattenPostCategories(tree);
      setCategoryOptions([{ label: '全部分类', value: '' }, ...categories]);
    } catch {
      setCategoryOptions([{ label: '全部分类', value: '' }]);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([fetchPosts(), fetchCategories()]);
    };

    void initialize();
  }, []);

  const filteredData = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return data.filter((record) => {
      const recordCategoryId = String((record.category as { id?: string } | undefined)?.id ?? '');
      const recordStatus = String(record.status ?? '');
      const title = String(record.title ?? '').toLowerCase();
      const author = String((record.author as { username?: string } | undefined)?.username ?? '').toLowerCase();

      if (categoryId && recordCategoryId !== categoryId) {
        return false;
      }

      if (status && recordStatus !== status) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      return title.includes(normalizedKeyword) || author.includes(normalizedKeyword);
    });
  }, [categoryId, data, keyword, status]);

  const runPostAction = async (
    action: () => Promise<unknown>,
    fallbackMessage: string,
    refresh = true,
  ) => {
    setActionLoading(true);
    setError('');

    try {
      await action();
      if (refresh) {
        await fetchPosts(false);
      }
    } catch (err) {
      setError(getErrorMessage(err, fallbackMessage));
    } finally {
      setActionLoading(false);
    }
  };

  const openMoveModal = (record: Record<string, unknown>) => {
    const id = String(record.id ?? '');
    if (!id) {
      return;
    }

    setMoveTargetPostId(id);
    setMoveCategoryId(String((record.category as { id?: string } | undefined)?.id ?? ''));
    setMoveModalOpen(true);
  };

  return (
    <Card title="帖子管理" loading={loading}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <PostFilters
        keyword={keywordInput}
        categoryId={categoryId}
        status={status}
        categoryOptions={categoryOptions}
        onKeywordChange={setKeywordInput}
        onCategoryChange={setCategoryId}
        onStatusChange={setStatus}
        onSearch={() => setKeyword(keywordInput.trim())}
        onReset={() => {
          setKeywordInput('');
          setKeyword('');
          setCategoryId('');
          setStatus('');
        }}
      />
      <Table
        rowKey={(record) => String(record.id ?? '')}
        columns={[
          { title: '标题', dataIndex: 'title', width: 280 },
          {
            title: '作者',
            render: (_unused: unknown, record: Record<string, unknown>) =>
              String((record.author as { username?: string } | undefined)?.username ?? '-'),
          },
          {
            title: '分类',
            render: (_unused: unknown, record: Record<string, unknown>) =>
              String((record.category as { name?: string } | undefined)?.name ?? '-'),
          },
          {
            title: '状态',
            render: (_unused: unknown, record: Record<string, unknown>) => {
              const currentStatus = String(record.status ?? '').trim();
              return (
                <Tag color={statusColorMap[currentStatus] ?? 'default'}>
                  {(statusLabelMap[currentStatus] ?? currentStatus) || '-'}
                </Tag>
              );
            },
          },
          { title: '浏览', dataIndex: 'viewCount' },
          { title: '评论', dataIndex: 'commentCount' },
          { title: '时间', dataIndex: 'createdAt' },
          {
            title: '操作',
            render: (_unused: unknown, record: Record<string, unknown>) => {
              const id = String(record.id ?? '');

              return (
                <Space>
                  <Button
                    type="link"
                    disabled={actionLoading}
                    onClick={() => {
                      if (id) navigate(`/forum/posts/${id}`);
                    }}
                  >
                    查看
                  </Button>
                  <Button
                    type="link"
                    disabled={actionLoading}
                    onClick={async () => {
                      if (!id) return;
                      const pinned = Boolean(record.isPinned);
                      await runPostAction(
                        () => adminForumApi.pinPost(id, { pinned: !pinned }),
                        pinned ? '取消置顶失败' : '置顶失败',
                      );
                    }}
                  >
                    {Boolean(record.isPinned) ? '取消置顶' : '置顶'}
                  </Button>
                  <Button
                    type="link"
                    disabled={actionLoading}
                    onClick={async () => {
                      if (!id) return;
                      const featured = Boolean(record.isFeatured);
                      await runPostAction(
                        () => adminForumApi.featurePost(id, { featured: !featured }),
                        featured ? '取消精华失败' : '设为精华失败',
                      );
                    }}
                  >
                    {Boolean(record.isFeatured) ? '取消精华' : '精华'}
                  </Button>
                  <Button
                    type="link"
                    disabled={actionLoading}
                    onClick={async () => {
                      if (!id) return;
                      const locked = Boolean(record.isLocked);
                      await runPostAction(
                        () => adminForumApi.lockPost(id, { locked: !locked }),
                        locked ? '取消锁定失败' : '锁定失败',
                      );
                    }}
                  >
                    {Boolean(record.isLocked) ? '解锁' : '锁定'}
                  </Button>
                  <Button type="link" disabled={actionLoading} onClick={() => openMoveModal(record)}>
                    移动
                  </Button>
                  <Button
                    type="link"
                    danger
                    disabled={actionLoading}
                    onClick={async () => {
                      if (!id) return;
                      await runPostAction(() => adminForumApi.deletePost(id), '删除失败');
                    }}
                  >
                    删除
                  </Button>
                </Space>
              );
            },
          },
        ]}
        dataSource={filteredData}
      />
      <MovePostModal
        open={moveModalOpen}
        value={moveCategoryId}
        loading={actionLoading}
        categoryOptions={categoryOptions.filter((item) => item.value)}
        onCancel={() => {
          if (actionLoading) {
            return;
          }
          setMoveModalOpen(false);
          setMoveTargetPostId('');
          setMoveCategoryId('');
        }}
        onChange={setMoveCategoryId}
        onOk={async () => {
          if (!moveTargetPostId || !moveCategoryId) {
            return;
          }

          await runPostAction(
            () => adminForumApi.movePost(moveTargetPostId, { categoryId: moveCategoryId }),
            '移动帖子失败',
          );

          setMoveModalOpen(false);
          setMoveTargetPostId('');
          setMoveCategoryId('');
        }}
      />
    </Card>
  );
};

export default PostManagePage;
