import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCopyToClipboard, useSiteSettings } from '../../hooks';
import { Button, Modal } from '../ui';

interface ShareButtonProps {
  url?: string;
  title?: string;
  summary?: string;
  contentType?: string;
}

interface PosterPayload {
  title: string;
  summary: string;
  url: string;
  contentType: string;
  siteName: string;
}
const DEFAULT_SITE_NAME = '社区';

const stripRichText = (input: string) =>
  String(input ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#>*_[\]()`~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const drawRoundRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const nextRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + nextRadius, y);
  context.lineTo(x + width - nextRadius, y);
  context.arcTo(x + width, y, x + width, y + nextRadius, nextRadius);
  context.lineTo(x + width, y + height - nextRadius);
  context.arcTo(x + width, y + height, x + width - nextRadius, y + height, nextRadius);
  context.lineTo(x + nextRadius, y + height);
  context.arcTo(x, y + height, x, y + height - nextRadius, nextRadius);
  context.lineTo(x, y + nextRadius);
  context.arcTo(x, y, x + nextRadius, y, nextRadius);
  context.closePath();
};

const drawWrappedText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) => {
  const raw = String(text ?? '').trim();
  if (!raw) {
    return y;
  }

  const chars = Array.from(raw);
  let currentLine = '';
  let currentLineIndex = 0;

  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];
    const nextLine = `${currentLine}${char}`;

    if (context.measureText(nextLine).width <= maxWidth || currentLine.length === 0) {
      currentLine = nextLine;
      continue;
    }

    const isLastLine = currentLineIndex === maxLines - 1;

    if (isLastLine) {
      let tail = currentLine;
      while (tail && context.measureText(`${tail}…`).width > maxWidth) {
        tail = tail.slice(0, -1);
      }
      context.fillText(`${tail}…`, x, y + currentLineIndex * lineHeight);
      return y + (currentLineIndex + 1) * lineHeight;
    }

    context.fillText(currentLine, x, y + currentLineIndex * lineHeight);
    currentLine = char;
    currentLineIndex += 1;
  }

  if (currentLineIndex < maxLines && currentLine) {
    context.fillText(currentLine, x, y + currentLineIndex * lineHeight);
    return y + (currentLineIndex + 1) * lineHeight;
  }

  return y + currentLineIndex * lineHeight;
};

const buildPosterDataUrl = ({ title, summary, url, contentType, siteName }: PosterPayload) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1560;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('浏览器不支持 Canvas');
  }

  const width = canvas.width;
  const height = canvas.height;

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1D4ED8');
  gradient.addColorStop(1, '#60A5FA');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  context.lineWidth = 1;
  for (let x = 0; x <= width; x += 54) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 0; y <= height; y += 54) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  const cardX = 72;
  const cardY = 90;
  const cardWidth = width - 144;
  const cardHeight = height - 180;

  drawRoundRect(context, cardX, cardY, cardWidth, cardHeight, 34);
  context.fillStyle = 'rgba(255, 255, 255, 0.97)';
  context.fill();
  context.strokeStyle = 'rgba(219, 234, 254, 0.85)';
  context.lineWidth = 2;
  context.stroke();

  const labelX = cardX + 48;
  const labelY = cardY + 48;
  const labelHeight = 54;
  const labelWidth = Math.min(420, Math.max(210, contentType.length * 40 + 160));

  drawRoundRect(context, labelX, labelY, labelWidth, labelHeight, 27);
  context.fillStyle = '#DBEAFE';
  context.fill();

  context.font = '600 26px "Inter", "Noto Sans SC", "PingFang SC", sans-serif';
  context.fillStyle = '#1E3A8A';
  context.fillText(contentType, labelX + 24, labelY + 35);

  context.textAlign = 'right';
  context.font = '500 24px "Inter", "Noto Sans SC", "PingFang SC", sans-serif';
  context.fillStyle = '#334155';
  context.fillText(siteName, cardX + cardWidth - 48, labelY + 35);
  context.textAlign = 'left';

  const contentX = cardX + 48;
  let currentY = labelY + labelHeight + 90;

  context.font = '700 60px "Inter", "Noto Sans SC", "PingFang SC", sans-serif';
  context.fillStyle = '#0F172A';
  currentY = drawWrappedText(context, title, contentX, currentY, cardWidth - 96, 78, 3) + 36;

  context.font = '500 34px "Inter", "Noto Sans SC", "PingFang SC", sans-serif';
  context.fillStyle = '#334155';
  drawWrappedText(context, summary, contentX, currentY, cardWidth - 96, 50, 5);

  const linkBoxY = cardY + cardHeight - 360;
  drawRoundRect(context, contentX, linkBoxY, cardWidth - 96, 180, 20);
  context.fillStyle = '#F8FAFC';
  context.fill();
  context.strokeStyle = '#E2E8F0';
  context.lineWidth = 2;
  context.stroke();

  context.font = '500 24px "Inter", "Noto Sans SC", "PingFang SC", sans-serif';
  context.fillStyle = '#475569';
  context.fillText('访问链接', contentX + 24, linkBoxY + 44);

  context.font = '600 26px "JetBrains Mono", "Inter", monospace';
  context.fillStyle = '#0F172A';
  drawWrappedText(context, url, contentX + 24, linkBoxY + 88, cardWidth - 144, 34, 2);

  const date = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  context.font = '500 22px "Inter", "Noto Sans SC", "PingFang SC", sans-serif';
  context.fillStyle = '#64748B';
  context.fillText(`生成时间：${date}`, contentX, cardY + cardHeight - 96);
  context.textAlign = 'right';
  context.fillText(`欢迎在 ${siteName} 交流创作`, cardX + cardWidth - 48, cardY + cardHeight - 96);
  context.textAlign = 'left';

  return canvas.toDataURL('image/png');
};

export const ShareButton = ({
  url,
  title,
  summary,
  contentType = '内容分享',
}: ShareButtonProps) => {
  const { copied, copy } = useCopyToClipboard();
  const { siteName } = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [posterUrl, setPosterUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const resolvedSiteName = useMemo(() => {
    const value = String(siteName ?? '').trim();
    return value || DEFAULT_SITE_NAME;
  }, [siteName]);

  const normalizedUrl = useMemo(() => {
    const value = String(url ?? '').trim();
    if (value) {
      return value;
    }
    return window.location.href;
  }, [url]);

  const normalizedTitle = useMemo(() => {
    const value = stripRichText(String(title ?? '')).trim();
    if (value) {
      return value;
    }
    return stripRichText(document.title || '内容详情').trim() || '内容详情';
  }, [title]);

  const normalizedSummary = useMemo(() => {
    const value = stripRichText(String(summary ?? '')).trim();
    if (value) {
      return value;
    }
    return `来自 ${resolvedSiteName} 的 ${contentType} 内容，点击链接查看完整详情。`;
  }, [contentType, resolvedSiteName, summary]);

  const generatePoster = useCallback(() => {
    setGenerating(true);
    setError('');

    try {
      const posterDataUrl = buildPosterDataUrl({
        title: normalizedTitle,
        summary: normalizedSummary,
        url: normalizedUrl,
        contentType,
        siteName: resolvedSiteName,
      });
      setPosterUrl(posterDataUrl);
    } catch {
      setError('海报生成失败，请稍后重试');
    } finally {
      setGenerating(false);
    }
  }, [contentType, normalizedSummary, normalizedTitle, normalizedUrl, resolvedSiteName]);

  useEffect(() => {
    if (!open || posterUrl || generating) {
      return;
    }

    generatePoster();
  }, [generatePoster, generating, open, posterUrl]);

  const downloadPoster = () => {
    if (!posterUrl) {
      return;
    }

    const safeTitle = normalizedTitle.replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 36) || '内容分享';

    const link = document.createElement('a');
    link.href = posterUrl;
    link.download = `${safeTitle}-海报.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          setOpen(true);
        }}
      >
        分享
      </Button>

      <Modal
        open={open}
        title="分享内容"
        onClose={() => setOpen(false)}
        footer={
          <div className="button-row" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button variant="outline" onClick={() => copy(normalizedUrl)} disabled={!normalizedUrl}>
              {copied ? '链接已复制' : '复制链接'}
            </Button>
            <Button variant="secondary" onClick={generatePoster} disabled={generating}>
              {generating ? '生成中...' : '重新生成海报'}
            </Button>
            <Button onClick={downloadPoster} disabled={!posterUrl || generating}>
              下载海报
            </Button>
          </div>
        }
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ color: 'var(--color-textSecondary)', fontSize: 13 }}>
            海报已包含标题、摘要和访问链接，可直接下载后转发到微信群、朋友圈或社区频道。
          </div>

          {error && (
            <div role="alert" style={{ color: 'var(--color-error)', fontSize: 13 }}>
              {error}
            </div>
          )}

          <div
            style={{
              border: '1px solid var(--c-border)',
              borderRadius: 12,
              background: 'var(--c-bg)',
              minHeight: 220,
              padding: 10,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {posterUrl ? (
              <img
                src={posterUrl}
                alt="分享海报预览"
                style={{ width: '100%', maxHeight: '62vh', objectFit: 'contain', borderRadius: 8 }}
              />
            ) : (
              <div style={{ fontSize: 13, color: 'var(--color-textSecondary)' }}>{generating ? '海报生成中...' : '点击生成海报'}</div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};
