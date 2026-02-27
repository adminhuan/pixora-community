import { Button, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';

interface CategoryTreeProps {
  treeData: DataNode[];
  onCreate?: () => void;
}

export const CategoryTree = ({ treeData, onCreate }: CategoryTreeProps) => (
  <div style={{ display: 'grid', gap: 12 }}>
    <Tree treeData={treeData} defaultExpandAll />
    <div>
      <Button type="primary" onClick={onCreate}>
        新增分类
      </Button>
    </div>
  </div>
);
