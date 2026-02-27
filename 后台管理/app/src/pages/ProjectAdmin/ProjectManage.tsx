import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Card, message } from 'antd';
import { adminProjectApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';
import { ProjectFilters, type ProjectFilterValue } from './components/ProjectFilters';
import { ProjectPreview } from './components/ProjectPreview';
import { ProjectTable, type ProjectRow } from './components/ProjectTable';

const ProjectManagePage = () => {
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [error, setError] = useState('');
  const [data, setData] = useState<ProjectRow[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectRow | null>(null);
  const [filterValue, setFilterValue] = useState<ProjectFilterValue>({
    keyword: '',
    categoryId: 'all',
    status: 'all',
  });

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [projectRes, categoryRes] = await Promise.all([adminProjectApi.projects(), adminProjectApi.categories()]);
      const projects = extractList<Record<string, unknown>>(projectRes).map((item) => ({
        key: String(item.id ?? ''),
        name: String(item.name ?? item.title ?? '未命名项目'),
        author: String((item.author as { username?: string } | undefined)?.username ?? '-'),
        stack: Array.isArray(item.techStack)
          ? (item.techStack as string[])
          : Array.isArray(item.techStacks)
            ? (item.techStacks as string[])
            : [],
        status: String(item.status ?? 'developing'),
        stars: Number(item.likeCount ?? 0) + Number(item.favoriteCount ?? 0),
        coverImage: String(item.coverImage ?? ''),
        categoryId: String((item.category as { id?: string } | undefined)?.id ?? ''),
        category: String((item.category as { name?: string } | undefined)?.name ?? '-'),
        description: String(item.description ?? ''),
        demoUrl: String(item.demoUrl ?? ''),
        sourceUrl: String(item.sourceUrl ?? ''),
        createdAt: String(item.createdAt ?? ''),
      }));

      const rows = projects.filter((item) => item.key);
      setData(rows);

      const categories = extractList<Record<string, unknown>>(categoryRes)
        .map((item) => ({ label: String(item.name ?? '-'), value: String(item.id ?? '') }))
        .filter((item) => item.value);
      setCategoryOptions(categories);

      setSelectedProject((current) => {
        if (current) {
          const hit = rows.find((item) => item.key === current.key);
          if (hit) {
            return hit;
          }
        }
        return rows[0] ?? null;
      });
    } catch (err) {
      setError(getErrorMessage(err, '项目管理数据加载失败'));
      setData([]);
      setCategoryOptions([]);
      setSelectedProject(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const filteredData = useMemo(() => {
    const keyword = filterValue.keyword.trim().toLowerCase();
    return data.filter((item) => {
      const matchKeyword =
        !keyword || item.name.toLowerCase().includes(keyword) || item.author.toLowerCase().includes(keyword);
      const matchCategory = filterValue.categoryId === 'all' || item.categoryId === filterValue.categoryId;
      const matchStatus = filterValue.status === 'all' || item.status === filterValue.status;
      return matchKeyword && matchCategory && matchStatus;
    });
  }, [data, filterValue]);

  const handleStatusChange = async (record: ProjectRow, status: string) => {
    if (!record.key || status === record.status) {
      return;
    }
    setActionLoadingId(record.key);
    setError('');
    try {
      await adminProjectApi.updateStatus(record.key, { status });
      message.success('项目状态更新成功');
      await fetchProjects();
    } catch (err) {
      setError(getErrorMessage(err, '项目状态更新失败'));
    } finally {
      setActionLoadingId('');
    }
  };

  const handleDelete = async (record: ProjectRow) => {
    if (!record.key) {
      return;
    }
    setActionLoadingId(record.key);
    setError('');
    try {
      await adminProjectApi.deleteProject(record.key);
      message.success('项目删除成功');
      await fetchProjects();
    } catch (err) {
      setError(getErrorMessage(err, '项目删除失败'));
    } finally {
      setActionLoadingId('');
    }
  };

  return (
    <Card title="项目管理" loading={loading}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <ProjectFilters
        value={filterValue}
        categoryOptions={categoryOptions}
        loading={loading}
        onChange={(patch) => setFilterValue((current) => ({ ...current, ...patch }))}
        onSearch={() => undefined}
        onReset={() => setFilterValue({ keyword: '', categoryId: 'all', status: 'all' })}
      />
      <ProjectTable
        data={filteredData}
        actionLoadingId={actionLoadingId}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        onPreview={setSelectedProject}
      />
      <ProjectPreview project={selectedProject} />
    </Card>
  );
};

export default ProjectManagePage;
