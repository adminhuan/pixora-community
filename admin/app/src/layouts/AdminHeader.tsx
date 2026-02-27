import { BellOutlined, LockOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Form, Input, Modal, Space, Typography, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuthApi } from '../api/auth';
import { getErrorMessage } from '../utils/api';
import { adminAuthStorage } from '../utils/auth';

export const AdminHeader = ({ siteName }: { siteName: string }) => {
  const navigate = useNavigate();
  const user = adminAuthStorage.getUser();
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [updatingAccount, setUpdatingAccount] = useState(false);
  const [accountForm] = Form.useForm<{ username: string; email: string }>();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm] = Form.useForm<{ oldPassword: string; newPassword: string; confirmPassword: string }>();

  const handleLogout = async () => {
    try {
      await adminAuthApi.logout();
    } catch {
      // ignore logout network errors and clear local session directly
    } finally {
      adminAuthStorage.clear();
      navigate('/login', { replace: true });
    }
  };

  const openChangePasswordModal = () => {
    passwordForm.resetFields();
    setPasswordModalOpen(true);
  };

  const openEditAccountModal = () => {
    accountForm.setFieldsValue({
      username: String(user?.username ?? ''),
      email: String(user?.email ?? '')
    });
    setAccountModalOpen(true);
  };

  const closeEditAccountModal = () => {
    if (updatingAccount) {
      return;
    }
    setAccountModalOpen(false);
    accountForm.resetFields();
  };

  const handleEditAccount = async () => {
    try {
      setUpdatingAccount(true);
      const values = await accountForm.validateFields();
      const response = await adminAuthApi.updateProfile({
        username: values.username.trim(),
        email: values.email.trim().toLowerCase()
      });
      const profile = (response?.data ?? {}) as { username?: string; email?: string };
      const current = adminAuthStorage.getUser();
      if (current) {
        adminAuthStorage.setUser({
          ...current,
          username: String(profile.username ?? values.username),
          email: String(profile.email ?? values.email)
        });
      }
      message.success('账号信息修改成功');
      setAccountModalOpen(false);
      accountForm.resetFields();
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }
      message.error(getErrorMessage(error, '账号信息修改失败'));
    } finally {
      setUpdatingAccount(false);
    }
  };

  const closeChangePasswordModal = () => {
    if (changingPassword) {
      return;
    }

    setPasswordModalOpen(false);
    passwordForm.resetFields();
  };

  const handleChangePassword = async () => {
    try {
      setChangingPassword(true);
      const values = await passwordForm.validateFields();
      await adminAuthApi.changePassword(values.oldPassword, values.newPassword);
      message.success('密码修改成功');
      setPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }
      message.error(getErrorMessage(error, '密码修改失败'));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <>
      <div
        style={{
          height: 64,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingInline: 16,
          borderBottom: '1px solid var(--admin-border)',
          background: 'var(--admin-surface)',
        }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          {siteName}管理后台
        </Typography.Title>
        <Space size={16}>
          <BellOutlined />
          <Avatar icon={<UserOutlined />} />
          <Typography.Text>{user?.username ?? '管理员'}</Typography.Text>
          <Button type="text" icon={<UserOutlined />} onClick={openEditAccountModal}>
            修改账号
          </Button>
          <Button type="text" icon={<LockOutlined />} onClick={openChangePasswordModal}>
            修改密码
          </Button>
          <Button type="text" icon={<LogoutOutlined />} onClick={() => void handleLogout()}>
            退出
          </Button>
        </Space>
      </div>
      <Modal
        title="修改账号"
        open={accountModalOpen}
        onCancel={closeEditAccountModal}
        onOk={() => void handleEditAccount()}
        okText="确认修改"
        cancelText="取消"
        confirmLoading={updatingAccount}
        destroyOnClose
      >
        <Form form={accountForm} layout="vertical" requiredMark={false}>
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, max: 32, message: '用户名长度需在 2-32 位之间' }
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="修改密码"
        open={passwordModalOpen}
        onCancel={closeChangePasswordModal}
        onOk={() => void handleChangePassword()}
        okText="确认修改"
        cancelText="取消"
        confirmLoading={changingPassword}
        destroyOnClose
      >
        <Form form={passwordForm} layout="vertical" requiredMark={false}>
          <Form.Item
            label="当前密码"
            name="oldPassword"
            rules={[
              { required: true, message: '请输入当前密码' },
              { min: 8, max: 64, message: '密码长度需在 8-64 位之间' }
            ]}
          >
            <Input.Password placeholder="请输入当前密码" autoComplete="current-password" />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, max: 64, message: '密码长度需在 8-64 位之间' },
              ({ getFieldValue }) => ({
                validator(_, value: string) {
                  if (!value || value !== getFieldValue('oldPassword')) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('新密码不能与当前密码相同'));
                }
              })
            ]}
          >
            <Input.Password placeholder="请输入新密码" autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value: string) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的新密码不一致'));
                }
              })
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
