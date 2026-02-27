import sharp from 'sharp';

export const processImage = async (buffer: Buffer, mode: 'avatar' | 'default' = 'default'): Promise<Buffer> => {
  const image = sharp(buffer).rotate();

  if (mode === 'avatar') {
    return image.resize(200, 200, { fit: 'cover' }).webp({ quality: 85 }).toBuffer();
  }

  return image.resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
};
