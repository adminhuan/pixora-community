import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { snippetApi } from '../../api';
import { Button } from '../../components/ui';
import { CodeEditor } from '../../components/shared/CodeEditor';
import { ComponentPreview } from '../../components/shared/ComponentPreview';
import { extractList, getErrorMessage } from '../../utils/api';
import type { Snippet, SnippetFile } from '../../types/common';

const DEFAULT_CATEGORY_OPTIONS = [{ value: '', label: '选择分类' }];
const CATEGORY_LABEL_MAP: Record<string, string> = {
  buttons: '按钮',
  cards: '卡片',
  loaders: '加载器',
  inputs: '输入框',
  toggles: '开关',
  checkboxes: '复选框',
  forms: '表单',
  patterns: '图案',
  alerts: '提示框',
  modals: '弹窗',
  navbars: '导航栏',
  footers: '页脚',
  other: '其他',
};

const resolveCategoryLabel = (value: string): string => {
  if (CATEGORY_LABEL_MAP[value]) {
    return CATEGORY_LABEL_MAP[value];
  }
  if (/[\u4e00-\u9fa5]/.test(value)) {
    return value;
  }
  return value.toUpperCase();
};

const FRAMEWORKS = [
  { value: 'css', label: 'CSS' },
  { value: 'tailwind', label: 'Tailwind' },
  { value: 'react', label: 'React' },
];

const TABS = [
  { key: 'html', label: 'index.html' },
  { key: 'css', label: 'style.css' },
  { key: 'js', label: 'script.js' },
];

const CreatePage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [framework, setFramework] = useState('css');
  const [htmlCode, setHtmlCode] = useState('<button class="btn">Click me</button>');
  const [cssCode, setCssCode] = useState('.btn {\n  padding: 10px 24px;\n  background: #3B82F6;\n  color: white;\n  border: none;\n  border-radius: 8px;\n  cursor: pointer;\n  font-size: 14px;\n  transition: background 0.2s;\n}\n.btn:hover {\n  background: #2563EB;\n}');
  const [jsCode, setJsCode] = useState('');
  const [tags, setTags] = useState('');
  const [activeTab, setActiveTab] = useState('html');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoryOptions, setCategoryOptions] = useState(DEFAULT_CATEGORY_OPTIONS);

  useEffect(() => {
    const loadCategoryOptions = async () => {
      try {
        const response = await snippetApi.list({
          page: 1,
          limit: 300,
          type: 'component',
          visibility: 'public',
        });

        const list = extractList<Snippet>(response);
        const seen = new Set<string>();
        const dynamicOptions: Array<{ value: string; label: string }> = [];

        list.forEach((item) => {
          const value = String(item.category ?? '').trim();
          if (!value || seen.has(value)) {
            return;
          }

          seen.add(value);
          dynamicOptions.push({ value, label: resolveCategoryLabel(value) });
        });

        if (dynamicOptions.length > 0) {
          setCategoryOptions([{ value: '', label: '选择分类' }, ...dynamicOptions]);
          return;
        }
      } catch {
        // ignore and fallback to default options
      }

      setCategoryOptions(DEFAULT_CATEGORY_OPTIONS);
    };

    void loadCategoryOptions();
  }, []);

  const previewFiles: SnippetFile[] = useMemo(() => {
    const files: SnippetFile[] = [];
    if (htmlCode.trim()) files.push({ id: '1', filename: 'index.html', language: 'html', content: htmlCode, snippetId: '' });
    if (cssCode.trim()) files.push({ id: '2', filename: 'style.css', language: 'css', content: cssCode, snippetId: '' });
    if (jsCode.trim()) files.push({ id: '3', filename: 'script.js', language: 'javascript', content: jsCode, snippetId: '' });
    return files;
  }, [htmlCode, cssCode, jsCode]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('请输入组件名称');
      return;
    }
    if (!htmlCode.trim() && !cssCode.trim()) {
      setError('请至少提供 HTML 或 CSS 代码');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const files: Array<{ filename: string; content: string }> = [];
      if (htmlCode.trim()) files.push({ filename: 'index.html', content: htmlCode });
      if (cssCode.trim()) files.push({ filename: 'style.css', content: cssCode });
      if (jsCode.trim()) files.push({ filename: 'script.js', content: jsCode });

      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);

      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || undefined,
        type: 'component',
        category: category || undefined,
        framework,
        files,
        tags: tagList.length > 0 ? tagList : undefined,
      };

      await snippetApi.create(payload);
      navigate('/explore');
    } catch (err) {
      setError(getErrorMessage(err, '发布失败'));
    } finally {
      setLoading(false);
    }
  };

  const codeMap: Record<string, { value: string; set: (v: string) => void; lang: string; ph: string }> = {
    html: { value: htmlCode, set: setHtmlCode, lang: 'html', ph: 'HTML 代码...' },
    css: { value: cssCode, set: setCssCode, lang: 'css', ph: 'CSS 代码...' },
    js: { value: jsCode, set: setJsCode, lang: 'javascript', ph: 'JavaScript 代码（可选）...' },
  };
  const current = codeMap[activeTab];

  return (
    <div className="cp-create">
      <div className="cp-create-header">
        <h1 className="cp-create-title">发布组件</h1>
      </div>

      <div className="cp-create-body">
        <div className="cp-create-editor">
          <div className="cp-create-form-row">
            <input
              className="cp-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="组件名称"
            />
          </div>
          <div className="cp-create-form-row">
            <input
              className="cp-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="组件描述（可选）"
            />
          </div>
          <div className="cp-create-form-row cp-create-selects">
            <select className="cp-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categoryOptions.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select className="cp-select" value={framework} onChange={(e) => setFramework(e.target.value)}>
              {FRAMEWORKS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <input
              className="cp-input"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="标签，用逗号分隔"
            />
          </div>

          <div className="vsc-window">
            <div className="vsc-titlebar">
              <span className="vsc-titlebar-text">{TABS.find((t) => t.key === activeTab)?.label}</span>
              <div className="vsc-controls">
                <span className="vsc-dot vsc-dot--close" />
                <span className="vsc-dot vsc-dot--min" />
                <span className="vsc-dot vsc-dot--max" />
              </div>
            </div>
            <div className="vsc-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`vsc-tab${tab.key === activeTab ? ' vsc-tab--active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <CodeEditor
              value={current.value}
              onChange={current.set}
              language={current.lang}
              placeholder={current.ph}
              minHeight={320}
            />
            <div className="vsc-footer">
              <span className="vsc-lang">{current.lang}</span>
              <span className="vsc-line-info">Lines: {current.value.split('\n').length}</span>
            </div>
          </div>

          {error && <div className="cp-error-text">{error}</div>}

          <div className="cp-create-submit">
            <Button disabled={loading} onClick={handleSubmit}>
              {loading ? '发布中...' : '发布组件'}
            </Button>
          </div>
        </div>

        <div className="cp-create-preview">
          <h3 className="cp-preview-title">实时预览</h3>
          <div className="cp-preview-frame">
            <ComponentPreview files={previewFiles} height={400} framework={framework} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;
