import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Modal, Popconfirm, Space, Table, Tag, message } from 'antd';
import { adminUserApi, adminIpBlacklistApi, adminIpWhitelistApi } from '../../api/admin';
import { extractList, getErrorMessage } from '../../utils/api';
import { BanModal } from './components/BanModal';
import { MuteModal } from './components/MuteModal';
import { UserFilters, type UserFilterValue } from './components/UserFilters';
import { UserTable, type UserRecord } from './components/UserTable';

const roleLabelMap: Record<string, string> = {
  user: '普通用户',
  moderator: '版主',
  admin: '管理员',
};

interface IpBlacklistRecord {
  key: string;
  id: string;
  ip: string;
  reason: string;
  createdByName: string;
  createdAt: string;
}

interface IpWhitelistRecord {
  key: string;
  id: string;
  ip: string;
  reason: string;
  createdByName: string;
  createdAt: string;
}

const UserListPage = () => {
  const [banOpen, setBanOpen] = useState(false);
  const [muteOpen, setMuteOpen] = useState(false);
  const [ipBlockOpen, setIpBlockOpen] = useState(false);
  const [ipBlockReason, setIpBlockReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [blacklistLoading, setBlacklistLoading] = useState(false);
  const [blacklistError, setBlacklistError] = useState('');
  const [removingIpId, setRemovingIpId] = useState('');
  const [whitelistLoading, setWhitelistLoading] = useState(false);
  const [whitelistError, setWhitelistError] = useState('');
  const [addingWhitelist, setAddingWhitelist] = useState(false);
  const [removingWhitelistId, setRemovingWhitelistId] = useState('');
  const [whitelistIp, setWhitelistIp] = useState('');
  const [whitelistReason, setWhitelistReason] = useState('');
  const [error, setError] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [filterValue, setFilterValue] = useState<UserFilterValue>({
    keyword: '',
    status: 'all',
  });
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [blacklistedIps, setBlacklistedIps] = useState<IpBlacklistRecord[]>([]);
  const [whitelistedIps, setWhitelistedIps] = useState<IpWhitelistRecord[]>([]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminUserApi.list();
      const list = extractList<Record<string, unknown>>(response).map((item) => ({
        key: String(item.id ?? ''),
        username: String(item.nickname ?? item.username ?? '未命名用户'),
        email: String(item.email ?? ''),
        role: roleLabelMap[String(item.role ?? '')] ?? String(item.role ?? '普通用户'),
        level: `Lv.${Number(item.level ?? 1)}`,
        status: String(item.status ?? 'active') as 'active' | 'muted' | 'banned',
        lastLoginIp: item.lastLoginIp ? String(item.lastLoginIp) : undefined,
        createdAt: String(item.createdAt ?? ''),
      }));

      setUsers(list.filter((item) => item.key));
    } catch (err) {
      setError(getErrorMessage(err, '用户列表加载失败，请确认账号权限'));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlacklist = async () => {
    setBlacklistLoading(true);
    setBlacklistError('');

    try {
      const response = await adminIpBlacklistApi.list();
      const list = extractList<Record<string, unknown>>(response).map((item) => ({
        key: String(item.id ?? ''),
        id: String(item.id ?? ''),
        ip: String(item.ip ?? '-'),
        reason: String(item.reason ?? ''),
        createdByName: String(item.createdByName ?? '-'),
        createdAt: String(item.createdAt ?? '-'),
      }));

      setBlacklistedIps(list.filter((item) => item.id));
    } catch (err) {
      setBlacklistError(getErrorMessage(err, 'IP黑名单加载失败'));
      setBlacklistedIps([]);
    } finally {
      setBlacklistLoading(false);
    }
  };

  const fetchWhitelist = async () => {
    setWhitelistLoading(true);
    setWhitelistError('');

    try {
      const response = await adminIpWhitelistApi.list();
      const list = extractList<Record<string, unknown>>(response).map((item) => ({
        key: String(item.id ?? ''),
        id: String(item.id ?? ''),
        ip: String(item.ip ?? '-'),
        reason: String(item.reason ?? ''),
        createdByName: String(item.createdByName ?? '-'),
        createdAt: String(item.createdAt ?? '-'),
      }));

      setWhitelistedIps(list.filter((item) => item.id));
    } catch (err) {
      setWhitelistError(getErrorMessage(err, 'IP白名单加载失败'));
      setWhitelistedIps([]);
    } finally {
      setWhitelistLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
    void fetchBlacklist();
    void fetchWhitelist();
  }, []);

  useEffect(() => {
    setSelectedRowKeys((current) => current.filter((item) => users.some((user) => user.key === item)));
  }, [users]);

  const filteredUsers = useMemo(() => {
    const keyword = filterValue.keyword.trim().toLowerCase();
    return users.filter((item) => {
      const matchKeyword =
        !keyword || item.username.toLowerCase().includes(keyword) || item.email.toLowerCase().includes(keyword);
      const matchStatus = filterValue.status === 'all' || item.status === filterValue.status;
      return matchKeyword && matchStatus;
    });
  }, [users, filterValue]);

  const handleBlockIp = async () => {
    if (!selectedUser?.lastLoginIp) return;
    try {
      await adminIpBlacklistApi.add({ ip: selectedUser.lastLoginIp, reason: ipBlockReason || undefined });
      message.success(`IP ${selectedUser.lastLoginIp} 已加入黑名单`);
      await fetchBlacklist();
    } catch (err) {
      message.error(getErrorMessage(err, 'IP封禁失败'));
    } finally {
      setIpBlockOpen(false);
      setSelectedUser(null);
      setIpBlockReason('');
    }
  };

  const handleAddWhitelist = async () => {
    if (!whitelistIp.trim()) {
      message.warning('请先输入IP地址');
      return;
    }

    setAddingWhitelist(true);
    try {
      await adminIpWhitelistApi.add({
        ip: whitelistIp.trim(),
        reason: whitelistReason.trim() || undefined,
      });
      message.success(`IP ${whitelistIp.trim()} 已加入白名单`);
      setWhitelistIp('');
      setWhitelistReason('');
      await fetchWhitelist();
    } catch (err) {
      message.error(getErrorMessage(err, '添加IP白名单失败'));
    } finally {
      setAddingWhitelist(false);
    }
  };

  const handleBatchAction = async (action: 'mute' | 'ban') => {
    if (!selectedRowKeys.length) {
      message.warning('请先选择用户');
      return;
    }

    setBatchLoading(true);
    const run = action === 'mute' ? adminUserApi.mute : adminUserApi.ban;
    const result = await Promise.allSettled(selectedRowKeys.map((id) => run(id, {})));
    const successCount = result.filter((item) => item.status === 'fulfilled').length;
    const failedCount = selectedRowKeys.length - successCount;

    if (successCount > 0) {
      message.success(`${action === 'mute' ? '批量禁言' : '批量封禁'}成功 ${successCount} 人`);
    }
    if (failedCount > 0) {
      message.warning(`${failedCount} 人处理失败，请检查权限或用户状态`);
    }

    await fetchUsers();
    setSelectedRowKeys([]);
    setBatchLoading(false);
  };

  const handleExportCsv = () => {
    const header = ['用户名', '邮箱', '角色', '等级', '状态', '最近登录IP', '注册时间'];
    const rows = filteredUsers.map((item) => [
      item.username,
      item.email,
      item.role,
      item.level,
      item.status,
      item.lastLoginIp ?? '',
      item.createdAt,
    ]);
    const csvText = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csvText}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'users.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="module-header">
        <h2>用户管理</h2>
        <Space>
          <Button loading={batchLoading} disabled={!selectedRowKeys.length} onClick={() => void handleBatchAction('mute')}>
            批量禁言
          </Button>
          <Button danger loading={batchLoading} disabled={!selectedRowKeys.length} onClick={() => void handleBatchAction('ban')}>
            批量封禁
          </Button>
        </Space>
      </div>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      <UserFilters
        value={filterValue}
        loading={loading}
        onChange={(patch) => setFilterValue((current) => ({ ...current, ...patch }))}
        onSearch={() => undefined}
        onReset={() => setFilterValue({ keyword: '', status: 'all' })}
        onExport={handleExportCsv}
      />
      <Card loading={loading}>
        <UserTable
          data={filteredUsers}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={setSelectedRowKeys}
          onView={(record) => {
            Modal.info({
              title: '用户详情',
              content: (
                <div>
                  <p>用户名：{record.username}</p>
                  <p>邮箱：{record.email || '-'}</p>
                  <p>角色：{record.role}</p>
                  <p>状态：{record.status}</p>
                  <p>最近登录IP：{record.lastLoginIp || '-'}</p>
                  <p>注册时间：{record.createdAt}</p>
                </div>
              ),
              okText: '关闭',
            });
          }}
          onBan={(record) => {
            setSelectedUser(record);
            setBanOpen(true);
          }}
          onMute={(record) => {
            setSelectedUser(record);
            setMuteOpen(true);
          }}
          onBlockIp={(record) => {
            setSelectedUser(record);
            setIpBlockOpen(true);
          }}
        />
      </Card>
      <Card
        title="IP黑名单"
        loading={blacklistLoading}
        style={{ marginTop: 12 }}
        extra={
          <Button onClick={() => void fetchBlacklist()} disabled={blacklistLoading}>
            刷新
          </Button>
        }
      >
        {blacklistError && <Alert type="error" showIcon message={blacklistError} style={{ marginBottom: 12 }} />}
        <Table<IpBlacklistRecord>
          rowKey="key"
          columns={[
            {
              title: 'IP地址',
              dataIndex: 'ip',
              render: (ip: string) => <Tag color="red">{ip}</Tag>,
            },
            {
              title: '封禁原因',
              dataIndex: 'reason',
              render: (reason: string) => reason || '-',
            },
            { title: '操作人', dataIndex: 'createdByName' },
            { title: '封禁时间', dataIndex: 'createdAt' },
            {
              title: '操作',
              render: (_unused, record) => (
                <Popconfirm
                  title="确认解除该IP封禁？"
                  okText="确认"
                  cancelText="取消"
                  onConfirm={async () => {
                    setRemovingIpId(record.id);
                    try {
                      await adminIpBlacklistApi.remove(record.id);
                      message.success(`IP ${record.ip} 已解除封禁`);
                      await fetchBlacklist();
                    } catch (err) {
                      message.error(getErrorMessage(err, '解除IP封禁失败'));
                    } finally {
                      setRemovingIpId('');
                    }
                  }}
                >
                  <Button type="link" danger loading={removingIpId === record.id}>
                    解除封禁
                  </Button>
                </Popconfirm>
              ),
            },
          ]}
          dataSource={blacklistedIps}
          pagination={{ pageSize: 8 }}
        />
      </Card>
      <Card
        title="IP白名单"
        loading={whitelistLoading}
        style={{ marginTop: 12 }}
        extra={
          <Button onClick={() => void fetchWhitelist()} disabled={whitelistLoading}>
            刷新
          </Button>
        }
      >
        {whitelistError && <Alert type="error" showIcon message={whitelistError} style={{ marginBottom: 12 }} />}
        <div style={{ marginBottom: 12, display: 'grid', gap: 8, gridTemplateColumns: '2fr 2fr auto' }}>
          <Input
            placeholder="输入白名单IP，例如 127.0.0.1"
            value={whitelistIp}
            onChange={(event) => setWhitelistIp(event.target.value)}
            allowClear
          />
          <Input
            placeholder="备注（可选）"
            value={whitelistReason}
            onChange={(event) => setWhitelistReason(event.target.value)}
            allowClear
          />
          <Button type="primary" loading={addingWhitelist} onClick={() => void handleAddWhitelist()}>
            添加白名单
          </Button>
        </div>
        <Table<IpWhitelistRecord>
          rowKey="key"
          columns={[
            {
              title: 'IP地址',
              dataIndex: 'ip',
              render: (ip: string) => <Tag color="green">{ip}</Tag>,
            },
            {
              title: '备注',
              dataIndex: 'reason',
              render: (reason: string) => reason || '-',
            },
            { title: '操作人', dataIndex: 'createdByName' },
            { title: '添加时间', dataIndex: 'createdAt' },
            {
              title: '操作',
              render: (_unused, record) => (
                <Popconfirm
                  title="确认移除该白名单IP？"
                  okText="确认"
                  cancelText="取消"
                  onConfirm={async () => {
                    setRemovingWhitelistId(record.id);
                    try {
                      await adminIpWhitelistApi.remove(record.id);
                      message.success(`IP ${record.ip} 已移出白名单`);
                      await fetchWhitelist();
                    } catch (err) {
                      message.error(getErrorMessage(err, '移除白名单失败'));
                    } finally {
                      setRemovingWhitelistId('');
                    }
                  }}
                >
                  <Button type="link" danger loading={removingWhitelistId === record.id}>
                    移除
                  </Button>
                </Popconfirm>
              ),
            },
          ]}
          dataSource={whitelistedIps}
          pagination={{ pageSize: 8 }}
        />
      </Card>
      <BanModal
        open={banOpen}
        onCancel={() => {
          setBanOpen(false);
          setSelectedUser(null);
        }}
        onOk={async () => {
          if (selectedUser) {
            await adminUserApi.ban(selectedUser.key, {});
            await fetchUsers();
          }
          setBanOpen(false);
          setSelectedUser(null);
        }}
      />
      <MuteModal
        open={muteOpen}
        onCancel={() => {
          setMuteOpen(false);
          setSelectedUser(null);
        }}
        onOk={async () => {
          if (selectedUser) {
            await adminUserApi.mute(selectedUser.key, {});
            await fetchUsers();
          }
          setMuteOpen(false);
          setSelectedUser(null);
        }}
      />
      <Modal
        title="封禁IP"
        open={ipBlockOpen}
        onOk={handleBlockIp}
        onCancel={() => {
          setIpBlockOpen(false);
          setSelectedUser(null);
          setIpBlockReason('');
        }}
        okText="确认封禁"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>
          确认将IP <strong>{selectedUser?.lastLoginIp}</strong> 加入黑名单？
        </p>
        <p>该IP下的所有请求将被拦截。</p>
        <Input.TextArea
          placeholder="封禁原因（可选）"
          value={ipBlockReason}
          onChange={(e) => setIpBlockReason(e.target.value)}
          rows={2}
        />
      </Modal>
    </div>
  );
};

export default UserListPage;
