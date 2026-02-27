import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryApi, postApi, tagApi } from '../../api';
import { Button, Card, Loading, Modal } from '../../components/ui';
import { TagSelector } from '../../components/Tag/TagSelector';
import { extractData, extractList, getErrorMessage } from '../../utils';

interface CategoryOption {
  id: string;
  name: string;
  label: string;
}

const flattenPostCategories = (items: Array<Record<string, unknown>>, prefix = ''): CategoryOption[] => {
  return items.flatMap((item) => {
    const id = String(item.id ?? '').trim();
    const name = String(item.name ?? '').trim();
    const type = String(item.type ?? '').trim();
    const nextLabel = prefix ? `${prefix} / ${name}` : name;
    const children = Array.isArray(item.children) ? (item.children as Array<Record<string, unknown>>) : [];

    const current = id && name && type === 'post' ? [{ id, name, label: nextLabel }] : [];
    return [...current, ...flattenPostCategories(children, nextLabel)];
  });
};

const CreatePostPage = () => {
  const navigate = useNavigate();
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagOptions, setTagOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [metaLoading, setMetaLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [applyingCategory, setApplyingCategory] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyCategoryName, setApplyCategoryName] = useState('');
  const [applyCategoryReason, setApplyCategoryReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchMeta = async () => {
      setMetaLoading(true);

      try {
        const [hotTagsRes, categoryRes] = await Promise.all([tagApi.hot(), categoryApi.list()]);

        const hotTagNames = extractList<Record<string, unknown>>(hotTagsRes)
          .map((item) => String(item.name ?? '').trim())
          .filter(Boolean);
        setTagOptions(Array.from(new Set(hotTagNames)));

        const categoryTree = extractData<Array<Record<string, unknown>>>(categoryRes, []);
        setCategoryOptions(flattenPostCategories(categoryTree));
      } catch {
        setTagOptions([]);
      } finally {
        setMetaLoading(false);
      }
    };

    void fetchMeta();
  }, []);

  const canSubmit = useMemo(() => title.trim().length >= 3 && content.trim().length >= 10, [title, content]);

  const insertMarkdownAtCursor = (markdown: string) => {
    const textarea = editorRef.current;
    if (!textarea) {
      setContent((prev) => `${prev}${prev.endsWith('\n') ? '' : '\n'}${markdown}\n`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    setContent((prev) => {
      const next = `${prev.slice(0, start)}${markdown}${prev.slice(end)}`;
      window.setTimeout(() => {
        textarea.focus();
        const cursor = start + markdown.length;
        textarea.setSelectionRange(cursor, cursor);
      }, 0);
      return next;
    });
  };

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

      insertMarkdownAtCursor(`\n![${file.name}](${imageUrl})\n`);
    } catch (err) {
      setError(getErrorMessage(err, '图片上传失败'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const submitPost = async (status: 'draft' | 'published') => {
    if (!canSubmit || saving) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await postApi.create({
        title: title.trim(),
        content,
        tags,
        categoryId: categoryId || undefined,
        status,
      });

      const created = extractData<Record<string, unknown> | null>(response, null);
      const createdId = String(created?.id ?? '').trim();
      const createdStatus = String(created?.status ?? '').trim();

      if (status === 'draft') {
        setSuccess('草稿已保存');
        return;
      }

      if (createdStatus === 'pending') {
        setSuccess('帖子已提交，正在等待审核，审核通过后将自动发布');
        return;
      }

      if (createdId) {
        navigate(`/forum/${createdId}`);
        return;
      }

      navigate('/forum');
    } catch (err) {
      setError(getErrorMessage(err, status === 'draft' ? '草稿保存失败' : '帖子发布失败'));
    } finally {
      setSaving(false);
    }
  };

  const applyCategory = async () => {
    const name = applyCategoryName.trim();
    if (!name) {
      setError('请输入你希望新增的板块/分类名称');
      return;
    }

    setError('');
    setSuccess('');
    setApplyingCategory(true);

    try {
      await categoryApi.apply({
        name,
        type: 'post',
        reason: applyCategoryReason.trim(),
      });

      setSuccess('分类申请已提交，管理员审核后可用');
      setApplyModalOpen(false);
      setApplyCategoryName('');
      setApplyCategoryReason('');
    } catch (err) {
      setError(getErrorMessage(err, '分类申请提交失败'));
    } finally {
      setApplyingCategory(false);
    }
  };

  return (
    <Card title="发布帖子">
      {metaLoading && <Loading text="加载标签与分类中..." />}
      {error && (
        <div role="alert" style={{ color: 'var(--color-error)', marginBottom: 12 }}>
          {error}
        </div>
      )}
      {success && <div style={{ color: 'var(--color-success)', marginBottom: 12 }}>{success}</div>}

      <div style={{ display: 'grid', gap: 16 }}>
        <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="请输入帖子标题" />

        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--color-textSecondary)' }}>帖子分类 / 板块</span>
            <Button variant="outline" onClick={() => setApplyModalOpen(true)}>
              申请新板块
            </Button>
          </div>
          <select className="input" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">未分类</option>
            {categoryOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <textarea
          ref={editorRef}
          className="textarea"
          rows={12}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="支持 Markdown 编辑"
        />

        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              {uploading ? '上传中...' : '插入图片'}
            </Button>
            <span style={{ fontSize: 12, color: 'var(--color-textSecondary)' }}>支持 jpg/png/gif/webp，单张不超过 5MB</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              void handleImageUpload(file);
            }}
          />
        </div>

        <TagSelector options={tagOptions} value={tags} onChange={setTags} max={5} />

        <div className="button-row">
          <Button variant="outline" disabled={saving || !canSubmit} onClick={() => void submitPost('draft')}>
            {saving ? '处理中...' : '保存草稿'}
          </Button>
          <Button disabled={saving || !canSubmit} onClick={() => void submitPost('published')}>
            {saving ? '处理中...' : '发布帖子'}
          </Button>
        </div>
      </div>

      <Modal
        open={applyModalOpen}
        title="申请新板块"
        onClose={() => {
          if (!applyingCategory) {
            setApplyModalOpen(false);
          }
        }}
        footer={(
          <div className="button-row" style={{ justifyContent: 'flex-end' }}>
            <Button
              variant="outline"
              onClick={() => {
                if (!applyingCategory) {
                  setApplyModalOpen(false);
                }
              }}
            >
              取消
            </Button>
            <Button onClick={() => void applyCategory()} disabled={applyingCategory}>
              {applyingCategory ? '提交中...' : '提交申请'}
            </Button>
          </div>
        )}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <input
            className="input"
            value={applyCategoryName}
            onChange={(event) => setApplyCategoryName(event.target.value)}
            placeholder="请输入你希望新增的板块/分类名称"
          />
          <textarea
            className="textarea"
            rows={4}
            value={applyCategoryReason}
            onChange={(event) => setApplyCategoryReason(event.target.value)}
            placeholder="请输入申请理由（可选）"
          />
        </div>
      </Modal>
    </Card>
  );
};

export default CreatePostPage;
