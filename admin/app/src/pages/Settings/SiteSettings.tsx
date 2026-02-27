import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Form, Input, Space, Spin, message } from 'antd';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { adminSettingsApi } from '../../api/admin';
import { notifyAdminSiteSettingsUpdated } from '../../hooks/useSiteName';
import { extractData, getErrorMessage } from '../../utils/api';

interface UploadResult {
  url?: string;
  fileId?: string;
}

const ImageUploadField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await adminSettingsApi.uploadImage(file);
      const data = (res as unknown as { data?: UploadResult })?.data;
      const url = data?.url ?? '';
      if (url) {
        onChange(url);
        message.success(`${label}上传成功`);
      }
    } catch (err) {
      message.error(getErrorMessage(err, '图片上传失败'));
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <Form.Item label={label}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <Button
            icon={<UploadOutlined />}
            loading={uploading}
            onClick={() => inputRef.current?.click()}
          >
            上传图片
          </Button>
          {value && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => onChange('')}
            >
              移除
            </Button>
          )}
        </Space>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              void handleUpload(file);
            }
          }}
        />
        {uploading && <Spin size="small" />}
        {value && (
          <div style={{ marginTop: 8 }}>
            <img
              src={value}
              alt={label}
              style={{
                maxWidth: 200,
                maxHeight: 200,
                borderRadius: 8,
                border: '1px solid #d9d9d9',
              }}
            />
          </div>
        )}
      </Space>
    </Form.Item>
  );
};

const SiteSettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [siteName, setSiteName] = useState('社区');
  const [logo, setLogo] = useState('');
  const [favicon, setFavicon] = useState('');
  const [description, setDescription] = useState('');
  const [icp, setIcp] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactWechat, setContactWechat] = useState('');
  const [contactWechatQR, setContactWechatQR] = useState('');
  const [contactQQ, setContactQQ] = useState('');
  const [contactQQQR, setContactQQQR] = useState('');
  const [contactAddress, setContactAddress] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await adminSettingsApi.getGroup('site');
        const data = extractData<Record<string, unknown>>(response, {});

        setSiteName(String(data.siteName ?? data.name ?? '社区'));
        setLogo(String(data.logo ?? ''));
        setFavicon(String(data.favicon ?? ''));
        setDescription(String(data.description ?? ''));
        setIcp(String(data.icp ?? ''));
        setContactEmail(String(data.contactEmail ?? data.email ?? ''));
        setContactPhone(String(data.contactPhone ?? ''));
        setContactWechat(String(data.contactWechat ?? ''));
        setContactWechatQR(String(data.contactWechatQR ?? ''));
        setContactQQ(String(data.contactQQ ?? ''));
        setContactQQQR(String(data.contactQQQR ?? ''));
        setContactAddress(String(data.contactAddress ?? ''));
      } catch (err) {
        setError(getErrorMessage(err, '站点设置加载失败'));
      } finally {
        setLoading(false);
      }
    };

    void fetchSettings();
  }, []);

  return (
    <Card title="站点基础设置" loading={loading}>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
      {success && <Alert type="success" showIcon message={success} style={{ marginBottom: 12 }} />}
      <Form layout="vertical">
        <Form.Item label="站点名称">
          <Input value={siteName} onChange={(event) => setSiteName(event.target.value)} />
        </Form.Item>
        <ImageUploadField
          label="站点 Logo（导航栏图标）"
          value={logo}
          onChange={setLogo}
        />
        <ImageUploadField
          label="站点图标 (Favicon)"
          value={favicon}
          onChange={setFavicon}
        />
        <Form.Item label="站点描述">
          <Input.TextArea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
        </Form.Item>
        <Form.Item label="备案号">
          <Input value={icp} onChange={(event) => setIcp(event.target.value)} />
        </Form.Item>
        <Form.Item label="联系邮箱">
          <Input value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="example@domain.com" />
        </Form.Item>
        <Form.Item label="联系电话">
          <Input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="如：400-xxx-xxxx" />
        </Form.Item>
        <Form.Item label="微信号">
          <Input value={contactWechat} onChange={(event) => setContactWechat(event.target.value)} placeholder="微信公众号或个人微信号" />
        </Form.Item>
        <ImageUploadField
          label="微信二维码"
          value={contactWechatQR}
          onChange={setContactWechatQR}
        />
        <Form.Item label="QQ / QQ群">
          <Input value={contactQQ} onChange={(event) => setContactQQ(event.target.value)} placeholder="QQ号或QQ群号" />
        </Form.Item>
        <ImageUploadField
          label="QQ二维码"
          value={contactQQQR}
          onChange={setContactQQQR}
        />
        <Form.Item label="联系地址">
          <Input value={contactAddress} onChange={(event) => setContactAddress(event.target.value)} placeholder="公司或团队地址" />
        </Form.Item>
        <Button
          type="primary"
          loading={saving}
          onClick={async () => {
            setSaving(true);
            setError('');
            setSuccess('');

            try {
              await adminSettingsApi.updateGroup('site', {
                siteName,
                logo,
                favicon,
                description,
                icp,
                contactEmail,
                contactPhone,
                contactWechat,
                contactWechatQR,
                contactQQ,
                contactQQQR,
                contactAddress,
              });
              setSuccess('站点设置已保存');
              notifyAdminSiteSettingsUpdated();
            } catch (err) {
              setError(getErrorMessage(err, '站点设置保存失败'));
            } finally {
              setSaving(false);
            }
          }}
        >
          保存配置
        </Button>
      </Form>
    </Card>
  );
};

export default SiteSettingsPage;
