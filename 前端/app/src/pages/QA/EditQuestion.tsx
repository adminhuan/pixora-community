import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { questionApi } from '../../api';
import { Button, Card, Loading } from '../../components/ui';
import { TagSelector } from '../../components/Tag/TagSelector';
import { extractData, getErrorMessage } from '../../utils';

const EditQuestionPage = () => {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await questionApi.detail(id);
        const detail = extractData<Record<string, unknown> | null>(response, null);

        setTitle(String(detail?.title ?? ''));
        setContent(String(detail?.content ?? ''));
        setTags(
          Array.isArray(detail?.tags)
            ? (detail?.tags as Array<{ tag?: { name?: string } }>).map((item) => String(item.tag?.name ?? '')).filter(Boolean)
            : [],
        );
      } catch (err) {
        setError(getErrorMessage(err, '问题详情加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchDetail();
  }, [id]);

  return (
    <Card title="编辑问题">
      {loading && <Loading text="加载问题中..." />}
      {error && (
        <div role="alert" style={{ color: 'var(--color-error)', marginBottom: 12 }}>
          {error}
        </div>
      )}
      <div style={{ display: 'grid', gap: 12 }}>
        <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="请输入问题标题" />
        <textarea
          className="textarea"
          rows={10}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="请详细描述问题场景"
        />
        <TagSelector value={tags} onChange={setTags} max={5} />
        <div className="button-row">
          <Button variant="outline" onClick={() => navigate(id ? `/qa/${id}` : '/qa')}>
            取消
          </Button>
          <Button
            onClick={async () => {
              if (!id) {
                return;
              }

              setSaving(true);
              try {
                await questionApi.update(id, { title, content, tags });
                navigate(`/qa/${id}`);
              } catch (err) {
                setError(getErrorMessage(err, '问题更新失败'));
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? '保存中...' : '保存修改'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default EditQuestionPage;
