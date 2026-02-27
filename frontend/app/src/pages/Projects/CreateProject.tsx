import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postApi, projectApi } from '../../api';
import { Button, Card } from '../../components/ui';
import { TagSelector } from '../../components/Tag/TagSelector';
import { extractData, getErrorMessage } from '../../utils';
import { PROJECT_STATUS_OPTIONS, normalizeProjectStatus, type ProjectStatusValue } from './constants/project-status';

const CreateProjectPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [status, setStatus] = useState<ProjectStatusValue>('completed');
  const [stacks, setStacks] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

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

      setCoverUrl(imageUrl);
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
    if (!name.trim()) {
      setError('请输入项目名称');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await projectApi.create({
        name,
        description: summary,
        content: description,
        techStack: stacks,
        coverImage: coverUrl || undefined,
        status,
      });
      const created = extractData<Record<string, unknown> | null>(response, null);
      const createdId = String(created?.id ?? '').trim();
      navigate(createdId ? `/projects/${createdId}` : '/projects', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, '提交失败，请重试'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title="发布项目">
      {error && <div role="alert" style={{ color: 'var(--color-error)', marginBottom: 12 }}>{error}</div>}
      <div style={{ display: 'grid', gap: 12 }}>
        <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="项目名称" />
        <input className="input" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="一句话简介" />
        <textarea
          className="textarea"
          rows={8}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="详细介绍（支持 Markdown）"
        />

        <div style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--color-textSecondary)' }}>展示状态</span>
          <select
            className="input"
            value={status}
            onChange={(event) => setStatus(normalizeProjectStatus(event.target.value))}
          >
            {PROJECT_STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--color-textSecondary)' }}>项目封面（可选）</span>
          {coverUrl ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img src={coverUrl} alt="封面" style={{ maxHeight: 160, borderRadius: 10, objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => setCoverUrl('')}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  height: 28,
                  minWidth: 54,
                  borderRadius: 999,
                  border: 'none',
                  background: 'rgba(15,23,42,0.82)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                移除
              </button>
            </div>
          ) : (
            <label
              style={{
                display: 'grid',
                placeItems: 'center',
                minHeight: 96,
                borderRadius: 10,
                border: '1px dashed var(--color-border)',
                color: 'var(--color-textSecondary)',
                background: 'var(--color-primaryBg)',
                cursor: uploading ? 'wait' : 'pointer',
                fontSize: 13,
              }}
            >
              {uploading ? '上传中...' : '点击上传项目封面'}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => void handleImageUpload(event.target.files?.[0] ?? null)}
              />
            </label>
          )}
        </div>

        <TagSelector value={stacks} onChange={setStacks} max={8} />

        <div className="button-row">
          <Button variant="outline" onClick={() => navigate(-1)}>
            取消
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting || uploading}>
            {submitting ? '提交中...' : '提交项目'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CreateProjectPage;
