import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import { adminUserApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';
import { openTextInputModal } from '../../utils/modal-input';

const roleNameMap: Record<string, string> = {
  user: '普通用户',
  moderator: '版主',
  admin: '管理员',
};

const defaultScopeMap: Record<string, string> = {
  user: '社区互动',
  moderator: '内容管理',
  admin: '全权限',
};

const RoleManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState<Array<Record<string, unknown>>>([]);
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignRoleId, setAssignRoleId] = useState('');
  const [assignRoleName, setAssignRoleName] = useState('');
  const [assignUserIds, setAssignUserIds] = useState<string[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignKeyword, setAssignKeyword] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const [roleRes, userRes] = await Promise.all([adminUserApi.roles(), adminUserApi.list({ page: 1, limit: 200 })]);
      setRoles(extractList<Record<string, unknown>>(roleRes));
      setUsers(extractList<Record<string, unknown>>(userRes));
    } catch (err) {
      setError(getErrorMessage(err, '角色权限数据加载失败'));
      setRoles([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const data = useMemo(
    () =>
      roles.map((role) => {
        const id = String(role.id ?? 'user');
        const count = users.filter((user) => String(user.role ?? 'user') === id).length;

        return {
          key: id,
          role: roleNameMap[id] ?? String(role.name ?? id),
          scope: defaultScopeMap[id] ?? '自定义权限',
          count,
        };
      }),
    [roles, users],
  );

  const assignCandidates = useMemo(() => {
    const keyword = assignKeyword.trim().toLowerCase();
    return users.filter((user) => {
      const userRole = String(user.role ?? 'user');
      if (userRole === assignRoleId) {
        return false;
      }
      if (!keyword) {
        return true;
      }

      const username = String(user.username ?? '').toLowerCase();
      const email = String(user.email ?? '').toLowerCase();
      return username.includes(keyword) || email.includes(keyword);
    });
  }, [assignKeyword, assignRoleId, users]);

  const openAssignModal = (roleId: string, roleLabel: string) => {
    setAssignRoleId(roleId);
    setAssignRoleName(roleLabel);
    setAssignUserIds([]);
    setAssignKeyword('');
    setAssignModalOpen(true);
  };

  const submitAssignUsers = async () => {
    if (!assignRoleId) {
      return;
    }
    if (assignUserIds.length === 0) {
      message.warning('请先选择要分配的用户');
      return;
    }

    setAssignLoading(true);
    setError('');
    try {
      await Promise.all(assignUserIds.map((id) => adminUserApi.updateRole(id, { role: assignRoleId })));
      message.success(`已将 ${assignUserIds.length} 位用户分配为${assignRoleName}`);
      setAssignModalOpen(false);
      setAssignUserIds([]);
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err, '分配用户失败'));
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <Card title="角色权限管理" loading={loading}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <Table
        rowKey="key"
        columns={[
          { title: '角色', dataIndex: 'role' },
          { title: '权限范围', dataIndex: 'scope', render: (value: string) => <Tag color="blue">{value}</Tag> },
          { title: '用户数', dataIndex: 'count' },
          {
            title: '操作',
            render: (_unused: unknown, record: Record<string, unknown>) => (
              <Space>
                <Button
                  type="link"
                  onClick={async () => {
                    const roleId = String(record.key ?? '');
                    if (!roleId) {
                      return;
                    }

                    const scope = await openTextInputModal({
                      title: '编辑权限描述',
                      initialValue: String(record.scope ?? ''),
                      placeholder: '请输入权限描述',
                      requiredMessage: '权限描述不能为空',
                    });
                    if (scope === null) {
                      return;
                    }

                    try {
                      await adminUserApi.updateRolePermission(roleId, { scope });
                    } catch (err) {
                      setError(getErrorMessage(err, '角色权限更新失败'));
                    }
                  }}
                >
                  编辑权限
                </Button>
                <Button type="link" onClick={() => openAssignModal(String(record.key ?? ''), String(record.role ?? '该角色'))}>
                  分配用户
                </Button>
              </Space>
            ),
          },
        ]}
        dataSource={data}
        pagination={false}
      />

      <Modal
        open={assignModalOpen}
        title={`分配用户到${assignRoleName}`}
        okText="确认分配"
        cancelText="取消"
        confirmLoading={assignLoading}
        onCancel={() => {
          if (!assignLoading) {
            setAssignModalOpen(false);
          }
        }}
        onOk={submitAssignUsers}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="搜索用户名或邮箱"
            value={assignKeyword}
            onChange={(event) => setAssignKeyword(event.target.value)}
          />
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="选择用户"
            value={assignUserIds}
            onChange={(value) => setAssignUserIds(value)}
            options={assignCandidates.map((user) => ({
              value: String(user.id ?? ''),
              label: `${String(user.username ?? '未命名用户')}（${String(user.email ?? '无邮箱')}）`,
            }))}
            optionFilterProp="label"
            maxTagCount="responsive"
          />
        </Space>
      </Modal>
    </Card>
  );
};

export default RoleManagementPage;
