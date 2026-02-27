import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { projectApi } from '../../api';
import { Button, Card, Empty, Loading } from '../../components/ui';
import type { ContentItem } from '../../types/common';
import { extractList, getErrorMessage } from '../../utils';
import { ProjectCard } from './components/ProjectCard';

const ProjectListPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await projectApi.list({ page: 1, limit: 20 });
        const data = extractList<Record<string, unknown>>(response).map((item) => ({
          id: String(item.id ?? ''),
          title: String(item.name ?? item.title ?? '未命名项目'),
          summary: String(item.summary ?? item.description ?? '').slice(0, 120),
          status: String(item.status ?? ''),
          coverImage: String(item.coverImage ?? ''),
          author:
            typeof item.author === 'object' && item.author
              ? {
                  id: String((item.author as { id?: string }).id ?? ''),
                  username: String(
                    (item.author as { nickname?: string; username?: string }).nickname ??
                      (item.author as { username?: string }).username ??
                      '匿名用户',
                  ),
                }
              : { id: '', username: '匿名用户' },
        }));

        setProjects(data.filter((item) => item.id));
      } catch (err) {
        setError(getErrorMessage(err, '项目列表加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchProjects();
  }, []);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Card
        title="项目展示"
        extra={
          <Button onClick={() => navigate('/projects/create')}>
            <Plus size={14} /> 发布项目
          </Button>
        }
      >
        按技术栈、状态、热度进行筛选与排序，展示你的项目成果和实践经验。
      </Card>
      {loading && <Loading text="项目加载中..." />}
      {error && (
        <Card title="加载提示">
          <div role="alert" style={{ color: 'var(--color-error)' }}>
            {error}
          </div>
        </Card>
      )}
      {!loading && !projects.length && <Empty description="暂无项目内容" />}
      <div className="card-grid">
        {projects.map((project) => (
          <Link key={project.id} to={`/projects/${project.id}`}>
            <ProjectCard project={project} />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProjectListPage;
