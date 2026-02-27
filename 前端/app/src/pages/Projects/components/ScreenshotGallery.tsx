import { resolveSafeImageSrc } from '../../../utils';

interface ScreenshotGalleryProps {
  images: string[];
}

export const ScreenshotGallery = ({ images }: ScreenshotGalleryProps) => {
  const normalizedImages = images
    .map((item) => resolveSafeImageSrc(item, { allowDataImage: true, allowRelative: true }))
    .filter((item) => item.length > 0);

  if (!normalizedImages.length) {
    return null;
  }

  return (
    <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
      {normalizedImages.map((image, index) => (
        <div
          key={`${image}-${index}`}
          style={{
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            background: 'var(--color-primaryBg)',
            overflow: 'hidden'
          }}
        >
          <img
            src={image}
            alt={`项目截图 ${index + 1}`}
            loading="lazy"
            style={{ display: 'block', width: '100%', height: 180, objectFit: 'cover' }}
          />
        </div>
      ))}
    </div>
  );
};
