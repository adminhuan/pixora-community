import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../../components/ui';
import { TagSelector } from '../../components/Tag/TagSelector';
import { snippetApi } from '../../api';
import { CategorySelect } from './components/CategorySelect';
import { COMPONENT_CATEGORIES } from './components/component-categories';
import { ComponentPreview } from './components/ComponentPreview';

const CODE_TABS = [
  { key: 'html', label: 'HTML', file: 'component.html' },
  { key: 'css', label: 'CSS', file: 'style.css' },
  { key: 'js', label: 'JavaScript', file: 'script.js' },
] as const;

const CreateCodePage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('buttons');
  const [html, setHtml] = useState('<!-- 在这里输入 HTML -->');
  const [css, setCss] = useState('/* 在这里输入 CSS */');
  const [js, setJs] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');

  const codeMap = { html, css, js };
  const setterMap = { html: setHtml, css: setCss, js: setJs };

  const handlePublish = async () => {
    const files = [
      { filename: 'component.html', language: 'html', content: html },
      { filename: 'style.css', language: 'css', content: css },
    ];
    if (js.trim()) {
      files.push({ filename: 'script.js', language: 'javascript', content: js });
    }

    await snippetApi.create({
      title,
      description: title,
      tags: [category, ...tags],
      files,
    });
    navigate('/code');
  };

  return (
    <div className="cg-create">
      <Card title="发布 UI 组件">
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
            <Button variant="outline" onClick={() => navigate('/code')}>取消</Button>
            <Button onClick={() => void handlePublish()}>发布组件</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CreateCodePage;
