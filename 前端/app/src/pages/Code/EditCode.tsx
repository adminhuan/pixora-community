import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { snippetApi } from '../../api';
import { Button, Card, Loading } from '../../components/ui';
import { TagSelector } from '../../components/Tag/TagSelector';
import { extractData, getErrorMessage } from '../../utils';
import { CategorySelect } from './components/CategorySelect';
import { COMPONENT_CATEGORIES } from './components/component-categories';
import { ComponentPreview } from './components/ComponentPreview';

const CODE_TABS = [
  { key: 'html', label: 'HTML' },
  { key: 'css', label: 'CSS' },
  { key: 'js', label: 'JavaScript' },
] as const;

const EditCodePage = () => {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('buttons');
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [js, setJs] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');

  const codeMap = { html, css, js };
  const setterMap = { html: setHtml, css: setCss, js: setJs };

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const response = await snippetApi.detail(id);
        const detail = extractData<Record<string, unknown> | null>(response, null);
        const files = Array.isArray(detail?.files)
          ? (detail?.files as Array<{ filename?: string; language?: string; content?: string }>)
          : [];

        setTitle(String(detail?.title ?? ''));

        const htmlF = files.find((f) => f.language === 'html' || f.filename?.endsWith('.html'));
        const cssF = files.find((f) => f.language === 'css' || f.filename?.endsWith('.css'));
        const jsF = files.find((f) => f.language === 'javascript' || f.filename?.endsWith('.js'));
        if (htmlF?.content) setHtml(htmlF.content);
        if (cssF?.content) setCss(cssF.content);
        if (jsF?.content) setJs(jsF.content);

        const rawTags = Array.isArray(detail?.tags)
          ? (detail?.tags as Array<{ tag?: { name?: string }; name?: string }>)
              .map((t) => String(t.tag?.name ?? t.name ?? ''))
              .filter(Boolean)
          : [];

        const catKeys = COMPONENT_CATEGORIES.map((c) => c.key);
        const foundCat = rawTags.find((t) => catKeys.includes(t.toLowerCase()));
        if (foundCat) setCategory(foundCat.toLowerCase());
        setTags(rawTags.filter((t) => !catKeys.includes(t.toLowerCase())));
      } catch (err) {
        setError(getErrorMessage(err, '组件加载失败'));
      } finally {
        setLoading(false);
      }
    };
    void fetchDetail();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const files = [
        { filename: 'component.html', language: 'html', content: html },
        { filename: 'style.css', language: 'css', content: css },
      ];
      if (js.trim()) files.push({ filename: 'script.js', language: 'javascript', content: js });

      await snippetApi.update(id, {
        title,
        tags: [category, ...tags],
        files,
        versionMessage: 'update component',
      });
      navigate(`/code/${id}`);
    } catch (err) {
      setError(getErrorMessage(err, '组件更新失败'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cg-create">
      <Card title="编辑 UI 组件">
        {loading && <Loading text="加载组件中..." />}
        {error && <div role="alert" style={{ color: 'var(--color-error)', marginBottom: 12 }}>{error}</div>}
        <div className="cg-create-form">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="组件名称" />
          <CategorySelect value={category} onChange={setCategory} />

          <div className="cg-create-split">
            <div className="cg-create-editor">
              <div className="vsc-tabs">
                {CODE_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`vsc-tab${activeTab === tab.key ? ' vsc-tab--active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <textarea
                className="cg-code-textarea"
                rows={16}
                value={codeMap[activeTab]}
                onChange={(e) => setterMap[activeTab](e.target.value)}
                placeholder={`输入 ${activeTab.toUpperCase()} 代码...`}
                spellCheck={false}
              />
            </div>
            <div className="cg-create-preview-wrap">
              <div className="cg-create-preview-label">Preview</div>
              <ComponentPreview html={html} css={css} js={js} />
            </div>
          </div>

          <TagSelector
            options={COMPONENT_CATEGORIES.map((c) => c.label)}
            value={tags}
            onChange={setTags}
            max={5}
          />
          <div className="button-row">
            <Button variant="outline" onClick={() => navigate(id ? `/code/${id}` : '/code')}>取消</Button>
            <Button onClick={() => void handleSave()}>{saving ? '保存中...' : '保存修改'}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EditCodePage;
