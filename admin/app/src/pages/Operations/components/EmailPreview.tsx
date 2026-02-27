import { Card } from 'antd';
import { useSiteName } from '../../../hooks/useSiteName';

export const EmailPreview = () => {
  const { siteName } = useSiteName();

  return (
    <Card size="small" title="邮件预览">
      <p style={{ margin: 0 }}>{`这是一封来自 ${siteName} 的运营通知邮件预览内容。`}</p>
    </Card>
  );
};
