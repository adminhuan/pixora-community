import { Button, DatePicker, Form, Input, Select } from 'antd';

export const AnnouncementForm = () => (
  <Form layout="vertical">
    <Form.Item label="公告标题">
      <Input />
    </Form.Item>
    <Form.Item label="公告类型">
      <Select
        options={[
          { label: '系统公告', value: 'system' },
          { label: '活动通知', value: 'event' },
          { label: '版本更新', value: 'release' },
          { label: '维护通知', value: 'maintenance' },
        ]}
      />
    </Form.Item>
    <Form.Item label="公告内容">
      <Input.TextArea rows={5} />
    </Form.Item>
    <Form.Item label="显示时间">
      <DatePicker.RangePicker showTime />
    </Form.Item>
    <Button type="primary">发布公告</Button>
  </Form>
);
