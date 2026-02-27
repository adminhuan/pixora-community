interface TagBadgeProps {
  name: string;
}

export const TagBadge = ({ name }: TagBadgeProps) => (
  <span className="apc-tag">{name}</span>
);
