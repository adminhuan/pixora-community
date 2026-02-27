import { TagBadge } from '../../../components/Tag/TagBadge';

interface TechStackTagsProps {
  stacks: string[];
}

export const TechStackTags = ({ stacks }: TechStackTagsProps) => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    {stacks.map((stack) => (
      <TagBadge key={stack} name={stack} />
    ))}
  </div>
);
