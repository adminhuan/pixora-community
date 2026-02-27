interface AvatarProps {
  src?: string;
  alt?: string;
  size?: number;
  name?: string;
}

export const Avatar = ({ src, alt, size = 36, name }: AvatarProps) => {
  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? name ?? 'avatar'}
        width={size}
        height={size}
        className="apc-avatar"
        style={{ width: size, height: size }}
      />
    );
  }

  const letter = (name ?? 'U').slice(0, 1).toUpperCase();

  return (
    <div
      className="apc-avatar apc-avatar--placeholder"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {letter}
    </div>
  );
};
