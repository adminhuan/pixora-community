import { useEffect, useMemo, useState } from 'react';
import { tagApi } from '../../api';
import { extractList } from '../../utils';

interface TagSelectorProps {
  options?: string[];
  value: string[];
  onChange: (value: string[]) => void;
  max?: number;
  allowCustom?: boolean;
  placeholder?: string;
}

const normalize = (value: string) => value.trim();

export const TagSelector = ({
  options,
  value,
  onChange,
  max = 5,
  allowCustom = true,
  placeholder = '搜索标签或输入后按回车创建',
}: TagSelectorProps) => {
  const [keyword, setKeyword] = useState('');
  const [hotTags, setHotTags] = useState<string[]>([]);

  useEffect(() => {
    if (options && options.length > 0) {
      return;
    }

    const fetchHotTags = async () => {
      try {
        const response = await tagApi.hot();
        const names = extractList<Record<string, unknown>>(response)
          .map((item) => String(item.name ?? '').trim())
          .filter(Boolean);
        setHotTags(names);
      } catch {
        /* ignore */
      }
    };

    void fetchHotTags();
  }, [options]);

  const effectiveOptions = options && options.length > 0 ? options : hotTags;

  const mergedOptions = useMemo(() => {
    const set = new Map<string, string>();

    [...effectiveOptions, ...value].forEach((item) => {
      const cleaned = normalize(item);
      if (!cleaned) {
        return;
      }

      const key = cleaned.toLowerCase();
      if (!set.has(key)) {
        set.set(key, cleaned);
      }
    });

    return Array.from(set.values());
  }, [effectiveOptions, value]);

  const filtered = useMemo(() => {
    if (!keyword.trim()) {
      return mergedOptions;
    }

    return mergedOptions.filter((option) => option.toLowerCase().includes(keyword.toLowerCase()));
  }, [mergedOptions, keyword]);

  const selectedMap = useMemo(() => {
    return new Set(value.map((item) => item.toLowerCase()));
  }, [value]);

  const selectedCount = value.length;
  const reachedLimit = selectedCount >= max;
  const normalizedKeyword = normalize(keyword);

  const keywordExists =
    !normalizedKeyword ||
    mergedOptions.some((item) => item.toLowerCase() === normalizedKeyword.toLowerCase()) ||
    selectedMap.has(normalizedKeyword.toLowerCase());

  const canCreate = allowCustom && !keywordExists && normalizedKeyword.length > 0 && !reachedLimit;

  const addTag = (rawTag: string) => {
    const tag = normalize(rawTag);
    if (!tag || reachedLimit) {
      return;
    }

    if (selectedMap.has(tag.toLowerCase())) {
      setKeyword('');
      return;
    }

    onChange([...value, tag]);
    setKeyword('');
  };

  const removeTag = (tag: string) => {
    const target = tag.toLowerCase();
    onChange(value.filter((item) => item.toLowerCase() !== target));
  };

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          className="input"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder={placeholder}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && canCreate) {
              event.preventDefault();
              addTag(keyword);
            }
          }}
        />
        {canCreate && (
          <button
            type="button"
            onClick={() => addTag(keyword)}
            style={{
              whiteSpace: 'nowrap',
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              padding: '10px 14px',
              cursor: 'pointer',
            }}
          >
            创建标签
          </button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-textSecondary)' }}>
        <span>已选择 {selectedCount}/{max}</span>
        {reachedLimit && <span>已达到最大选择数量</span>}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {filtered.map((tag) => {
          const selected = selectedMap.has(tag.toLowerCase());
          return (
            <button
              key={tag}
              type="button"
              onClick={() => {
                if (selected) {
                  removeTag(tag);
                  return;
                }

                addTag(tag);
              }}
              style={{
                border: selected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                borderRadius: 999,
                background: selected ? 'var(--color-primaryBg)' : 'var(--color-surface)',
                color: selected ? 'var(--color-primaryDark)' : 'var(--color-textSecondary)',
                padding: '4px 12px',
                cursor: reachedLimit && !selected ? 'not-allowed' : 'pointer',
                opacity: reachedLimit && !selected ? 0.6 : 1,
              }}
              disabled={reachedLimit && !selected}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
};
