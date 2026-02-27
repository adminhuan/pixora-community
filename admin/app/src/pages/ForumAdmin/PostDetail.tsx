import { useEffect, useState } from 'react';
import { Alert, Avatar, Button, Card, Divider, Drawer, Empty, List, Space, Tag, Typography, message } from 'antd';
import {
  ArrowLeftOutlined,
  EyeOutlined,
  CommentOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { adminForumApi, adminCommentApi } from '../../api/admin';
import { SafeMarkdown } from '../../components/shared/safe-markdown';
import { extractData, extractList, getErrorMessage } from '../../utils/api';
import { resolveSafeUrl } from '../../utils/safe-url';

const formatTime = (value: unknown) => {
  const text = String(value ?? '').trim();
  return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-';
};

const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState<Array<Record<string, unknown>>>([]);

  const refresh = async () => {
    if (!id) return;
    const response = await adminForumApi.postDetail(id);
    const result = extractData<Record<string, unknown>>(response, {});
    setDetail(Object.keys(result).length > 0 ? result : null);
  };

  const fetchComments = async () => {
    if (!id) return;
    setCommentsLoading(true);
    try {
      const response = await adminCommentApi.comments({ targetType: 'post', targetId: id });
      setComments(extractList<Record<string, unknown>>(response));
    } catch (err) {
      message.error(getErrorMessage(err, '评论加载失败'));
    } finally {
      setCommentsLoading(false);
    }
  };

  const openComments = () => {
    setDrawerOpen(true);
    void fetchComments();
  };

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      try {
        await refresh();
      } catch (err) {
        setError(getErrorMessage(err, '帖子详情加载失败'));
        setDetail(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchDetail();
  }, [id]);

  const author = detail?.author as { username?: string; nickname?: string } | undefined;
  const category = detail?.category as { name?: string } | undefined;
  const content = String(detail?.content ?? '');
  const status = String(detail?.status ?? '');

  const statusMap: Record<string, { color: string; label: string }> = {
    published: { color: 'green', label: '已发布' },
    draft: { color: 'default', label: '草稿' },
    deleted: { color: 'red', label: '已删除' },
    pending: { color: 'orange', label: '待审核' }
  };

  const statusInfo = statusMap[status] ?? { color: 'default', label: status || '-' };

  return (
    <>
      <Card loading={loading}>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/forum/posts')}
            style={{ padding: 0 }}
          >
            返回帖子列表
          </Button>
        </div>

        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

        {detail && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {String(detail.title ?? '-')}
                </Typography.Title>
                <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                {Boolean(detail.isPinned) && <Tag color="red">置顶</Tag>}
                {Boolean(detail.isFeatured) && <Tag color="gold">精华</Tag>}
                {Boolean(detail.isLocked) && <Tag color="default">已锁定</Tag>}
              </div>
              <Space>
                <Button
                  onClick={async () => {
                    try {
                      if (!id) return;
                      await adminForumApi.pinPost(id, { pinned: !detail.isPinned });
                      await refresh();
                    } catch (err) {
                      setError(getErrorMessage(err, '操作失败'));
                    }
                  }}
                >
                  {detail.isPinned ? '取消置顶' : '置顶'}
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      if (!id) return;
                      await adminForumApi.featurePost(id, { featured: !detail.isFeatured });
                      await refresh();
                    } catch (err) {
                      setError(getErrorMessage(err, '操作失败'));
                    }
                  }}
                >
                  {detail.isFeatured ? '取消精华' : '精华'}
                </Button>
                <Button
                  danger
                  onClick={async () => {
                    try {
                      if (!id) return;
                      await adminForumApi.deletePost(id);
                      navigate('/forum/posts');
                    } catch (err) {
                      setError(getErrorMessage(err, '删除失败'));
                    }
                  }}
                >
                  删除
                </Button>
              </Space>
            </div>

            <div style={{ display: 'flex', gap: 24, color: '#8c8c8c', fontSize: 14, marginBottom: 20 }}>
              <span>作者：{author?.nickname || author?.username || '-'}</span>
              <span>分类：{category?.name || '-'}</span>
              <span>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {formatTime(detail.createdAt)}
              </span>
              <span>
                <EyeOutlined style={{ marginRight: 4 }} />
                {Number(detail.viewCount ?? 0)}
              </span>
              <span
                onClick={openComments}
                style={{ cursor: 'pointer', color: '#1677ff', transition: 'opacity .2s' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <CommentOutlined style={{ marginRight: 4 }} />
                {Number(detail.commentCount ?? 0)}
              </span>
            </div>

            <Divider style={{ margin: '0 0 20px' }} />

            <SafeMarkdown content={content} />
          </>
        )}
      </Card>

      <Drawer title={`评论列表（${comments.length}）`} open={drawerOpen} onClose={() => setDrawerOpen(false)} width={520}>
        <List
          loading={commentsLoading}
          dataSource={comments}
          locale={{ emptyText: <Empty description="暂无评论" /> }}
          renderItem={(item) => {
            const commentAuthor = item.author as { username?: string; nickname?: string; avatar?: string } | undefined;
            const avatar = commentAuthor?.avatar ? resolveSafeUrl(String(commentAuthor.avatar), { allowMailTo: false, allowTel: false }) : undefined;

            return (
              <List.Item
                actions={[
                  <Button
                    key="delete"
                    type="link"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={async () => {
                      try {
                        await adminCommentApi.deleteComment(String(item.id));
                        message.success('删除成功');
                        await fetchComments();
                      } catch (err) {
                        message.error(getErrorMessage(err, '删除失败'));
                      }
                    }}
                  >
                    删除
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={avatar} icon={!avatar ? <UserOutlined /> : undefined} />}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{commentAuthor?.nickname || commentAuthor?.username || '-'}</span>
                      <span style={{ fontSize: 12, color: '#8c8c8c', fontWeight: 'normal' }}>{formatTime(item.createdAt)}</span>
                    </div>
                  }
                  description={
                    <div style={{ color: '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {String(item.content ?? '')}
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Drawer>
    </>
  );
};

export default PostDetailPage;
