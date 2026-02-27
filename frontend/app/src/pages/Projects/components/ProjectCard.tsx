import type { ContentItem } from '../../../types/common';
import { Badge, Card } from '../../../components/ui';
import { resolveSafeImageSrc } from '../../../utils';
import { getProjectStatusLabel, normalizeProjectStatus } from '../constants/project-status';

interface ProjectCardProps {
  project: ContentItem;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const coverImage = resolveSafeImageSrc(String(project.coverImage ?? ''), { allowDataImage: true, allowRelative: true });
  const statusLabel = getProjectStatusLabel(normalizeProjectStatus(project.status));

  return (
    <Card>
      <div style={{ display: 'grid', gap: 8 }}>
        {coverImage ? (
          <img
            src={coverImage}
            alt={project.title ?? '项目封面'}
            loading="lazy"
            style={{
              display: 'block',
              width: '100%',
              height: 140,
              borderRadius: 10,
              objectFit: 'cover',
              border: '1px solid var(--color-border)'
            }}
          />
        ) : (
          <div
            style={{
              height: 140,
              borderRadius: 10,
              background: 'linear-gradient(140deg, rgba(37,99,235,0.2), rgba(59,130,246,0.05))',
              border: '1px solid var(--color-border)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--color-textSecondary)',
              fontSize: 12
            }}
          >
            暂无封面
          </div>
        )}

        <h3 style={{ margin: 0 }}>{project.title}</h3>
        <p style={{ margin: 0, color: 'var(--color-textSecondary)' }}>{project.summary}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--color-textSecondary)' }}>{project.author?.username}</span>
          <Badge>{statusLabel}</Badge>
        </div>
      </div>
    </Card>
  );
};
