import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogApi, postApi } from '../../api';
import { Button, Card } from '../../components/ui';
import { TagSelector } from '../../components/Tag/TagSelector';
import { MarkdownEditor, type MarkdownEditorHandle } from './components/MarkdownEditor';
import { extractData, getErrorMessage, resolveSafeImageSrc } from '../../utils';
const WriteBlogPage = () => {
  const navigate = useNavigate();
  const editorRef = useRef<MarkdownEditorHandle>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await postApi.uploadImage(formData);
    const payload = extractData<Record<string, unknown> | null>(response, null);
    const imageUrl = String(payload?.url ?? '').trim();
    if (!imageUrl) throw new Error('上传成功但未返回图片地址');
    return imageUrl;
  };

  const handleCoverUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadImage(file);
      setCoverUrl(url);
    } catch (err) {
      setError(getErrorMessage(err, '封面上传失败'));
    } finally {
      setUploading(false);
    }
  };

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
        const url = await uploadImage(file);
        editorRef.current?.insertAtCursor(`![${file.name}](${url})`);
      } catch (err) {
        setError(getErrorMessage(err, '图片上传失败'));
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const handlePublish = async () => {
    if (!title.trim()) { setError('请输入文章标题'); return; }
    if (!content.trim()) { setError('请输入文章内容'); return; }

    setSubmitting(true);
    setError('');

    try {
      const response = await blogApi.create({ title, content, tags, coverImage: coverUrl || undefined });
      const created = extractData<Record<string, unknown> | null>(response, null);
      const createdId = String(created?.id ?? '').trim();
      const createdStatus = String(created?.status ?? '').trim();

      if (createdStatus === 'pending') {
        setSuccess('文章已提交，正在等待审核，审核通过后将自动发布');
        setSubmitting(false);
        return;
      }

      navigate(createdId ? `/blog/${createdId}` : '/blog', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, '发布失败，请重试'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!title.trim() && !content.trim()) { setError('标题和内容不能都为空'); return; }

    setDraftSaving(true);
    setError('');
    setSuccess('');

    try {
      await blogApi.saveDraft({ title, content, tags, coverImage: coverUrl || undefined });
      setSuccess('草稿已保存');
    } catch (err) {
      setError(getErrorMessage(err, '草稿保存失败'));
    } finally {
      setDraftSaving(false);
    }
  };

  return (
    <Card title="写博客">
      {error && <div role="alert" style={{ color: 'var(--color-error)', marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ color: 'var(--color-success)', marginBottom: 12 }}>{success}</div>}
      <div style={{ display: 'grid', gap: 12 }}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="文章标题" />

        <div style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--color-textSecondary)' }}>封面图片（可选）</span>
          {coverUrl ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={resolveSafeImageSrc(coverUrl, { allowDataImage: true, allowRelative: true })}
                alt="封面"
                style={{ maxHeight: 140, borderRadius: 8, objectFit: 'cover' }}
              />
              <button
                type="button"
                onClick={() => setCoverUrl('')}
                style={{
                  position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%',
                  border: 'none', background: 'rgba(0,0,0,0.5)', color: '#fff', cursor: 'pointer', fontSize: 14,
                }}
              >
                x
              </button>
            </div>
          ) : (
            <label
              style={{
                display: 'grid', placeItems: 'center', minHeight: 80, borderRadius: 8,
                border: '1px dashed var(--color-border)', color: 'var(--color-textSecondary)',
                background: 'var(--color-primaryBg)', cursor: 'pointer', fontSize: 13,
              }}
            >
              点击上传封面图片
              <input type="file" accept="image/*" hidden onChange={(e) => void handleCoverUpload(e.target.files?.[0] ?? null)} />
            </label>
          )}
        </div>

        <MarkdownEditor
          ref={editorRef}
          value={content}
          onChange={setContent}
          onInsertImage={handleInlineImageUpload}
          uploading={uploading}
        />

        <TagSelector value={tags} onChange={setTags} />

        <div className="button-row">
          <Button variant="outline" onClick={() => void handleSaveDraft()} disabled={draftSaving}>
            {draftSaving ? '保存中...' : '保存草稿'}
          </Button>
          <Button onClick={() => void handlePublish()} disabled={submitting}>
            {submitting ? '发布中...' : '发布文章'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default WriteBlogPage;
