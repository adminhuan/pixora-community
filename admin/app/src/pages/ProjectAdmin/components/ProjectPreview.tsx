import { Button, Card, Empty, Space, Tag } from 'antd';
import type { ProjectRow } from './ProjectTable';

interface ProjectPreviewProps {
  project: ProjectRow | null;
}

export const ProjectPreview = ({ project }: ProjectPreviewProps) => (
  <Card size="small" title="项目预览">
    {project ? (
      <div style={{ display: 'grid', gap: 8 }}>
        {project.coverImage ? (
          <img
            src={project.coverImage}
            alt={project.name}
            style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 10, border: '1px solid #d9e1ec' }}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无封面图" />
        )}
        <div style={{ fontWeight: 600 }}>{project.name}</div>
        <div style={{ color: '#475569' }}>{project.description || '暂无项目描述'}</div>
        <Space wrap>
          {(project.stack || []).map((item) => (
            <Tag key={item} color="blue">
              {item}
            </Tag>
          ))}
        </Space>
        <Space>
          {project.demoUrl && (
            <Button size="small" href={project.demoUrl} target="_blank" rel="noreferrer">
              访问演示
            </Button>
          )}
          {project.sourceUrl && (
            <Button size="small" href={project.sourceUrl} target="_blank" rel="noreferrer">
              查看源码
            </Button>
          )}
        </Space>
      </div>
    ) : (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择项目查看详情" />
    )}
  </Card>
);
