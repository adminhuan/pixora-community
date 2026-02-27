import { Badge } from '../../../components/ui';
import { getProjectStatusLabel, type ProjectStatusValue } from '../constants/project-status';

interface ProjectStatusProps {
  status: ProjectStatusValue;
}

export const ProjectStatus = ({ status }: ProjectStatusProps) => <Badge>{getProjectStatusLabel(status)}</Badge>;
