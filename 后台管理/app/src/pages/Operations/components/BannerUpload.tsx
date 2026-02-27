import { Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

export const BannerUpload = () => (
  <Upload>
    <button type="button" style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 12px', background: '#fff' }}>
      <UploadOutlined /> 上传 Banner
    </button>
  </Upload>
);
