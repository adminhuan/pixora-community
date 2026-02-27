import { Button, Card } from '../../../components/ui';

export const SettingsForm = () => (
  <Card title="个人设置">
    <div style={{ display: 'grid', gap: 12 }}>
      <input className="input" placeholder="昵称" />
      <input className="input" placeholder="职位" />
      <input className="input" placeholder="公司" />
      <textarea className="textarea" rows={4} placeholder="个人简介" />
      <label>
        <input type="checkbox" defaultChecked /> 开启站内通知
      </label>
      <label>
        <input type="checkbox" defaultChecked /> 开启邮件通知
      </label>
      <Button>保存设置</Button>
    </div>
  </Card>
);
