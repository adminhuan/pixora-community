export type ProjectStatusValue = 'developing' | 'completed' | 'maintained' | 'deprecated';

const PROJECT_STATUS_LABEL_MAP: Record<ProjectStatusValue, string> = {
  developing: '展示中',
  completed: '已发布',
  maintained: '长期维护',
  deprecated: '已下线',
};

export const PROJECT_STATUS_OPTIONS: Array<{ value: ProjectStatusValue; label: string }> = [
  { value: 'completed', label: '已发布（推荐）' },
  { value: 'maintained', label: '长期维护' },
  { value: 'developing', label: '展示中' },
  { value: 'deprecated', label: '已下线' },
];

export const normalizeProjectStatus = (status: unknown): ProjectStatusValue => {
  const value = String(status ?? '').trim();
  if (value === 'completed' || value === 'developing' || value === 'maintained' || value === 'deprecated') {
    return value;
  }
  return 'completed';
};

export const getProjectStatusLabel = (status: ProjectStatusValue) => PROJECT_STATUS_LABEL_MAP[status];
