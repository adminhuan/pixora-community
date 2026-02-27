import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postApi, questionApi } from '../../api';
import { Button, Card } from '../../components/ui';
import { TagSelector } from '../../components/Tag/TagSelector';
import { extractData, getErrorMessage } from '../../utils';

const AskQuestionPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [bounty, setBounty] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleImageUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await postApi.uploadImage(formData);
      const payload = extractData<Record<string, unknown> | null>(response, null);
      const imageUrl = String(payload?.url ?? '').trim();

      if (!imageUrl) {
        throw new Error('上传成功但未返回图片地址');
      }

      setContent((prev) => `${prev}${prev.endsWith('\n') ? '' : '\n'}![${file.name}](${imageUrl})\n`);
    } catch (err) {
      setError(getErrorMessage(err, '图片上传失败'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('请输入问题标题');
      return;
    }
    if (!content.trim()) {
      setError('请详细描述问题');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await questionApi.create({ title, content, tags, bounty });
      const created = extractData<Record<string, unknown> | null>(response, null);
      const createdId = String(created?.id ?? '').trim();
      const createdStatus = String(created?.status ?? '').trim();

      if (createdStatus === 'pending') {
        setSuccess('问题已提交，正在等待审核，审核通过后将自动发布');
        setSubmitting(false);
        return;
      }

      navigate(createdId ? `/qa/${createdId}` : '/qa', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, '发布失败，请重试'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title="我要提问">
      {error && <div role="alert" style={{ color: 'var(--color-error)', marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ color: 'var(--color-success)', marginBottom: 12 }}>{success}</div>}
      <div style={{ display: 'grid', gap: 12 }}>
        <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="请输入问题标题" />
        <textarea
          className="textarea"
          rows={10}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="请详细描述问题场景，支持 Markdown"
        />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? '上传中...' : '插入图片'}
          </Button>
          <span style={{ fontSize: 12, color: 'var(--color-textSecondary)' }}>上传后自动插入 Markdown 图片标记</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          hidden
          onChange={(e) => void handleImageUpload(e.target.files?.[0] ?? null)}
        />

        <TagSelector value={tags} onChange={setTags} max={5} />

        <input
          className="input"
          type="number"
          min={0}
          value={bounty}
          onChange={(event) => setBounty(Number(event.target.value) || 0)}
          placeholder="悬赏积分（可选）"
        />

        <div className="button-row">
          <Button variant="outline" onClick={() => navigate(-1)}>取消</Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? '发布中...' : '发布问题'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AskQuestionPage;
