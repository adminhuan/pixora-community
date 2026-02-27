import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { blogApi, postApi } from '../../api';
import { Button, Card, Loading } from '../../components/ui';
import { TagSelector } from '../../components/Tag/TagSelector';
import { extractData, getErrorMessage } from '../../utils';
import { MarkdownEditor, type MarkdownEditorHandle } from './components/MarkdownEditor';

const EditBlogPage = () => {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const response = await blogApi.detail(id);
        const detail = extractData<Record<string, unknown> | null>(response, null);
        setTitle(String(detail?.title ?? ''));
        setContent(String(detail?.content ?? ''));
        setTags(
          Array.isArray(detail?.tags)
            ? (detail?.tags as Array<{ tag?: { name?: string } }>).map((item) => String(item.tag?.name ?? '')).filter(Boolean)
            : [],
        );
      } catch (err) {
        setError(getErrorMessage(err, '博客详情加载失败'));
      } finally {
        setLoading(false);
      }
    };
    void fetchDetail();
  }, [id]);

  const handleInlineImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/gif,image/webp';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(true);
      setError('');
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await postApi.uploadImage(formData);
        const payload = extractData<Record<string, unknown> | null>(response, null);
        const url = String(payload?.url ?? '').trim();
        if (url) {
          editorRef.current?.insertAtCursor(`![${file.name}](${url})`);
        }
      } catch (err) {
        setError(getErrorMessage(err, '图片上传失败'));
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  return (
    <Card title="编辑博客">
      {loading && <Loading text="加载博客中..." />}
      {error && <div role="alert" style={{ color: 'var(--color-error)', marginBottom: 12 }}>{error}</div>}
      <div style={{ display: 'grid', gap: 12 }}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="文章标题" />

        <MarkdownEditor
          ref={editorRef}
          value={content}
          onChange={setContent}
          onInsertImage={handleInlineImageUpload}
          uploading={uploading}
        />

        <TagSelector value={tags} onChange={setTags} />
        <div className="button-row">
          <Button variant="outline" onClick={() => navigate(id ? `/blog/${id}` : '/blog')}>
            取消
          </Button>
          <Button
            onClick={async () => {
              if (!id) return;
              setSaving(true);
              try {
                await blogApi.update(id, { title, content, tags });
                navigate(`/blog/${id}`);
              } catch (err) {
                setError(getErrorMessage(err, '博客更新失败'));
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

export default EditBlogPage;
