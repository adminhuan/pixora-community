import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, InputNumber, Row, Segmented, Space, Statistic, Switch, Table, Tabs, Tag, message } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ComposedChart, Line, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { adminAnalyticsApi, adminSettingsApi } from '../../api/admin';
import { extractData, extractList, getErrorMessage } from '../../utils/api';

interface ModuleItem {
  key: string;
  name: string;
  count: number;
}

interface RegionItem {
  name: string;
  count: number;
}

interface RegionData {
  countries: RegionItem[];
  provinces: RegionItem[];
}

interface HomeClickModuleItem {
  key: string;
  name: string;
  count: number;
}

interface HomeClickTrendItem {
  date: string;
  count: number;
}

interface HomeClickTargetItem {
  key: string;
  targetType: string;
  targetId: string;
  targetTitle: string;
  count: number;
}

interface HomeClickTargetFunnelItem {
  targetType: string;
  clicked: number;
  viewed: number;
  interacted: number;
  viewRate: number;
  interactionRate: number;
}

interface HomeClickFunnelData {
  entryEvents: number;
  detailViewEvents: number;
  interactionEvents: number;
  entryActors: number;
  detailViewActors: number;
  interactionActors: number;
  detailViewRate: number;
  interactionRate: number;
}

interface HomeClickData {
  days: number;
  since: string;
  totalClicks: number;
  uniqueUsers: number;
  moduleClicks: HomeClickModuleItem[];
  trend: HomeClickTrendItem[];
  topTargets: HomeClickTargetItem[];
  funnel: HomeClickFunnelData;
  targetTypeFunnel: HomeClickTargetFunnelItem[];
}

interface IpProtectionSummary {
  total: number;
  allowed: number;
  blocked: number;
  whitelistAllowed: number;
  whitelistBlocked: number;
  blacklistBlocked: number;
  uniqueBlockedIps: number;
}

interface TopBlockedIpItem {
  ip: string;
  rule: 'whitelist' | 'blacklist';
  count: number;
}

interface RecentBlockedItem {
  id: string;
  ip: string;
  method: string;
  path: string;
  statusCode: number;
  rule: 'whitelist' | 'blacklist';
  reason: string;
  createdAt: string;
}

interface IpProtectionData {
  enabled: boolean;
  hours: number;
  since: string;
  summary: IpProtectionSummary;
  topBlockedIps: TopBlockedIpItem[];
  recentBlocked: RecentBlockedItem[];
}

interface IpTrendPoint {
  label: string;
  total: number;
  allowed: number;
  blocked: number;
  whitelistBlocked: number;
  blacklistBlocked: number;
}

interface IpTrendData {
  hours: number;
  bucket: 'hour' | 'day';
  since: string;
  alertThreshold: number;
  maxBlocked: number;
  alertCount: number;
  notification?: {
    sent: boolean;
    reason?: string;
    lastSentAt?: string;
    cooldownMinutes: number;
  };
  points: IpTrendPoint[];
  alerts: IpTrendPoint[];
}

const defaultIpProtection: IpProtectionData = {
  enabled: false,
  hours: 24,
  since: '',
  summary: {
    total: 0,
    allowed: 0,
    blocked: 0,
    whitelistAllowed: 0,
    whitelistBlocked: 0,
    blacklistBlocked: 0,
    uniqueBlockedIps: 0,
  },
  topBlockedIps: [],
  recentBlocked: [],
};

const defaultIpTrend: IpTrendData = {
  hours: 24,
  bucket: 'hour',
  since: '',
  alertThreshold: 10,
  maxBlocked: 0,
  alertCount: 0,
  points: [],
  alerts: [],
};

const defaultHomeClicks: HomeClickData = {
  days: 7,
  since: '',
  totalClicks: 0,
  uniqueUsers: 0,
  moduleClicks: [],
  trend: [],
  topTargets: [],
  funnel: {
    entryEvents: 0,
    detailViewEvents: 0,
    interactionEvents: 0,
    entryActors: 0,
    detailViewActors: 0,
    interactionActors: 0,
    detailViewRate: 0,
    interactionRate: 0
  },
  targetTypeFunnel: []
};

const ipHoursOptions = [
  { label: '24小时', value: 24 },
  { label: '7天', value: 24 * 7 },
  { label: '30天', value: 24 * 30 },
];

const notificationReasonLabelMap: Record<string, string> = {
  NOTIFY_DISABLED: '通知已关闭',
  NO_ALERTS: '未触发阈值',
  COOLDOWN: '处于冷却期'
};

const homeDaysOptions = [
  { label: '近7天', value: 7 },
  { label: '近14天', value: 14 },
  { label: '近30天', value: 30 }
];

const DataOverviewPage = () => {
  const navigate = useNavigate();
  const [moduleData, setModuleData] = useState<ModuleItem[]>([]);
  const [regionData, setRegionData] = useState<RegionData>({ countries: [], provinces: [] });
  const [homeClicks, setHomeClicks] = useState<HomeClickData>(defaultHomeClicks);
  const [ipProtection, setIpProtection] = useState<IpProtectionData>(defaultIpProtection);
  const [ipTrend, setIpTrend] = useState<IpTrendData>(defaultIpTrend);
  const [loading, setLoading] = useState(false);
  const [homeClickLoading, setHomeClickLoading] = useState(false);
  const [ipLoading, setIpLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [homeDays, setHomeDays] = useState<number>(7);
  const [ipHours, setIpHours] = useState<number>(24);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState<number>(20);
  const [alertThresholdInput, setAlertThresholdInput] = useState<number>(20);
  const [thresholdSaving, setThresholdSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const [moduleRes, regionRes, securityRes] = await Promise.all([
          adminAnalyticsApi.moduleTraffic(),
          adminAnalyticsApi.regionTraffic(),
          adminSettingsApi.getGroup('security')
        ]);
        setModuleData(extractList<ModuleItem>(moduleRes));
        const region = extractData<RegionData>(regionRes, { countries: [], provinces: [] });
        setRegionData(region);
        const security = extractData<Record<string, unknown>>(securityRes, {});
        const settingThreshold = Number(security.ipAlertThreshold ?? 20);
        if (Number.isFinite(settingThreshold) && settingThreshold > 0) {
          const normalized = Math.floor(settingThreshold);
          setAlertThreshold(normalized);
          setAlertThresholdInput(normalized);
        }
      } catch (err) {
        setError(getErrorMessage(err, '数据加载失败'));
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, []);

  const fetchHomeClicks = async (days: number) => {
    setHomeClickLoading(true);
    setError('');
    try {
      const response = await adminAnalyticsApi.homeClicks({ days });
      const data = extractData<Record<string, unknown>>(response, {});
      const moduleClicks = Array.isArray(data.moduleClicks) ? (data.moduleClicks as HomeClickModuleItem[]) : [];
      const trend = Array.isArray(data.trend) ? (data.trend as HomeClickTrendItem[]) : [];
      const topTargets = Array.isArray(data.topTargets) ? (data.topTargets as HomeClickTargetItem[]) : [];
      const targetTypeFunnel = Array.isArray(data.targetTypeFunnel) ? (data.targetTypeFunnel as HomeClickTargetFunnelItem[]) : [];
      const funnelRaw =
        data.funnel && typeof data.funnel === 'object' && !Array.isArray(data.funnel)
          ? (data.funnel as Record<string, unknown>)
          : {};

      setHomeClicks({
        days: Number(data.days ?? days) || days,
        since: String(data.since ?? ''),
        totalClicks: Number(data.totalClicks ?? 0),
        uniqueUsers: Number(data.uniqueUsers ?? 0),
        moduleClicks,
        trend,
        topTargets,
        targetTypeFunnel,
        funnel: {
          entryEvents: Number(funnelRaw.entryEvents ?? 0),
          detailViewEvents: Number(funnelRaw.detailViewEvents ?? 0),
          interactionEvents: Number(funnelRaw.interactionEvents ?? 0),
          entryActors: Number(funnelRaw.entryActors ?? 0),
          detailViewActors: Number(funnelRaw.detailViewActors ?? 0),
          interactionActors: Number(funnelRaw.interactionActors ?? 0),
          detailViewRate: Number(funnelRaw.detailViewRate ?? 0),
          interactionRate: Number(funnelRaw.interactionRate ?? 0)
        }
      });
    } catch (err) {
      setError(getErrorMessage(err, '首页点击统计加载失败'));
      setHomeClicks(defaultHomeClicks);
    } finally {
      setHomeClickLoading(false);
    }
  };

  useEffect(() => {
    void fetchHomeClicks(homeDays);
  }, [homeDays]);

  const fetchIpProtection = async (hours: number, threshold: number) => {
    setIpLoading(true);
    setError('');
    try {
      const [ipRes, trendRes] = await Promise.all([
        adminAnalyticsApi.ipProtection({ hours }),
        adminAnalyticsApi.ipProtectionTrend({ hours, threshold }),
      ]);
      setIpProtection(extractData<IpProtectionData>(ipRes, defaultIpProtection));
      setIpTrend(extractData<IpTrendData>(trendRes, defaultIpTrend));
    } catch (err) {
      setError(getErrorMessage(err, 'IP防护数据加载失败'));
      setIpProtection(defaultIpProtection);
      setIpTrend(defaultIpTrend);
    } finally {
      setIpLoading(false);
    }
  };

  useEffect(() => {
    void fetchIpProtection(ipHours, alertThreshold);
  }, [ipHours, alertThreshold]);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const timer = window.setInterval(() => {
      void fetchIpProtection(ipHours, alertThreshold);
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, [autoRefresh, ipHours, alertThreshold]);

  const applyAlertThreshold = async () => {
    const normalized = Math.max(1, Math.floor(Number(alertThresholdInput) || 1));
    setAlertThresholdInput(normalized);
    setThresholdSaving(true);
    try {
      await adminSettingsApi.updateGroup('security', { ipAlertThreshold: normalized });
      setAlertThreshold(normalized);
      message.success('告警阈值已保存');
    } catch (err) {
      message.error(getErrorMessage(err, '告警阈值保存失败'));
    } finally {
      setThresholdSaving(false);
    }
  };

  const handleExportIpProtection = async () => {
    setExporting(true);
    try {
      const payload = await adminAnalyticsApi.ipProtectionExport({
        hours: ipHours,
        format: 'csv',
      });

      const blob =
        payload instanceof Blob ? payload : new Blob([String(payload ?? '')], { type: 'text/csv; charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ip-protection-${ipHours}h.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('IP防护明细已导出');
    } catch (err) {
      message.error(getErrorMessage(err, 'IP防护明细导出失败'));
    } finally {
      setExporting(false);
    }
  };

  const totalRequests = useMemo(
    () => moduleData.reduce((sum, m) => sum + m.count, 0),
    [moduleData],
  );

  const regionColumns = [
    { title: '地区', dataIndex: 'name', key: 'name' },
    { title: '访问IP数', dataIndex: 'count', key: 'count', sorter: (a: RegionItem, b: RegionItem) => a.count - b.count },
  ];

  const topBlockedColumns = [
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      render: (ip: string) => <Tag color="red">{ip}</Tag>,
    },
    {
      title: '触发规则',
      dataIndex: 'rule',
      key: 'rule',
      render: (rule: string) => <Tag color={rule === 'blacklist' ? 'red' : 'orange'}>{rule === 'blacklist' ? '黑名单' : '白名单'}</Tag>,
    },
    { title: '拦截次数', dataIndex: 'count', key: 'count', sorter: (a: TopBlockedIpItem, b: TopBlockedIpItem) => a.count - b.count },
  ];

  const recentBlockedColumns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 140,
      render: (ip: string) => <Tag color="red">{ip}</Tag>,
    },
    {
      title: '规则',
      dataIndex: 'rule',
      key: 'rule',
      width: 100,
      render: (rule: string) => <Tag color={rule === 'blacklist' ? 'red' : 'orange'}>{rule === 'blacklist' ? '黑名单' : '白名单'}</Tag>,
    },
    { title: '状态码', dataIndex: 'statusCode', key: 'statusCode', width: 90 },
    { title: '方法', dataIndex: 'method', key: 'method', width: 90 },
    { title: '路径', dataIndex: 'path', key: 'path', ellipsis: true },
    { title: '原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
  ];

  const trendAlertColumns = [
    { title: '时间段', dataIndex: 'label', key: 'label', width: 170 },
    { title: '总拦截', dataIndex: 'blocked', key: 'blocked', width: 90 },
    { title: '白名单拦截', dataIndex: 'whitelistBlocked', key: 'whitelistBlocked', width: 120 },
    { title: '黑名单拦截', dataIndex: 'blacklistBlocked', key: 'blacklistBlocked', width: 120 },
    { title: '总事件', dataIndex: 'total', key: 'total', width: 90 },
  ];

  const homeTargetColumns = [
    {
      title: '目标',
      dataIndex: 'targetTitle',
      key: 'targetTitle',
      ellipsis: true,
      render: (value: string, record: HomeClickTargetItem) => value || record.targetId || '未命名目标'
    },
    {
      title: '类型',
      dataIndex: 'targetType',
      key: 'targetType',
      width: 120,
      render: (value: string) => <Tag color="blue">{value || '-'}</Tag>
    },
    {
      title: '点击次数',
      dataIndex: 'count',
      key: 'count',
      width: 110,
      sorter: (a: HomeClickTargetItem, b: HomeClickTargetItem) => a.count - b.count
    }
  ];

  const homeFunnelColumns = [
    {
      title: '目标类型',
      dataIndex: 'targetType',
      key: 'targetType',
      width: 130,
      render: (value: string) => <Tag color="blue">{value || '-'}</Tag>
    },
    {
      title: '入口点击',
      dataIndex: 'clicked',
      key: 'clicked',
      width: 110
    },
    {
      title: '详情浏览',
      dataIndex: 'viewed',
      key: 'viewed',
      width: 110
    },
    {
      title: '互动次数',
      dataIndex: 'interacted',
      key: 'interacted',
      width: 110
    },
    {
      title: '点击→浏览',
      key: 'viewRate',
      width: 120,
      render: (_unused: unknown, record: HomeClickTargetFunnelItem) => `${record.viewRate}%`
    },
    {
      title: '浏览→互动',
      key: 'interactionRate',
      width: 120,
      render: (_unused: unknown, record: HomeClickTargetFunnelItem) => `${record.interactionRate}%`
    }
  ];

  return (
    <div>
      <div className="module-header">
        <h2>数据总览</h2>
      </div>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic title="总请求量" value={totalRequests} />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic title="覆盖国家/地区" value={regionData.countries.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic title="覆盖省份(中国)" value={regionData.provinces.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic title="功能模块数" value={moduleData.length} />
          </Card>
        </Col>
      </Row>

      <Card title="模块访问量" loading={loading} style={{ marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={moduleData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#2563EB" name="请求量" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="地区访问量分布" loading={loading}>
        <Tabs
          items={[
            {
              key: 'country',
              label: '按国家/地区',
              children: (
                <Table
                  dataSource={regionData.countries.map((c, i) => ({ ...c, key: String(i) }))}
                  columns={regionColumns}
                  pagination={{ pageSize: 15 }}
                />
              ),
            },
            {
              key: 'province',
              label: '按省份(中国)',
              children: (
                <Table
                  dataSource={regionData.provinces.map((p, i) => ({ ...p, key: String(i) }))}
                  columns={regionColumns}
                  pagination={{ pageSize: 15 }}
                />
              ),
            },
          ]}
        />
      </Card>

      <Card
        title={`首页点击热力（近${homeClicks.days}天）`}
        loading={homeClickLoading}
        style={{ marginTop: 24 }}
        extra={
          <Space size={8}>
            <Segmented
              options={homeDaysOptions}
              value={homeDays}
              onChange={(value) => setHomeDays(Number(value) || 7)}
            />
            <Button onClick={() => void fetchHomeClicks(homeDays)} disabled={homeClickLoading}>
              刷新
            </Button>
          </Space>
        }
      >
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Card size="small" loading={homeClickLoading}>
              <Statistic title="总点击次数" value={homeClicks.totalClicks} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" loading={homeClickLoading}>
              <Statistic title="参与用户数" value={homeClicks.uniqueUsers} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" loading={homeClickLoading}>
              <Statistic title="覆盖模块数" value={homeClicks.moduleClicks.filter((item) => item.count > 0).length} />
            </Card>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Card size="small" loading={homeClickLoading}>
              <Statistic title="入口点击事件" value={homeClicks.funnel.entryEvents} />
              <div style={{ marginTop: 6, fontSize: 12, color: '#64748B' }}>参与主体：{homeClicks.funnel.entryActors}</div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" loading={homeClickLoading}>
              <Statistic title="详情浏览事件" value={homeClicks.funnel.detailViewEvents} />
              <div style={{ marginTop: 6, fontSize: 12, color: '#64748B' }}>
                转化率：{homeClicks.funnel.detailViewRate}%（主体 {homeClicks.funnel.detailViewActors}）
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" loading={homeClickLoading}>
              <Statistic title="详情互动事件" value={homeClicks.funnel.interactionEvents} />
              <div style={{ marginTop: 6, fontSize: 12, color: '#64748B' }}>
                转化率：{homeClicks.funnel.interactionRate}%（主体 {homeClicks.funnel.interactionActors}）
              </div>
            </Card>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Card title="模块点击分布" size="small" loading={homeClickLoading}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={homeClicks.moduleClicks}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563EB" name="点击数" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="点击趋势" size="small" loading={homeClickLoading}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={homeClicks.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" minTickGap={24} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1D4ED8" name="点击数" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col span={24}>
            <Table
              rowKey="targetType"
              style={{ marginTop: 12 }}
              title={() => '首页流量转化漏斗（按目标类型）'}
              dataSource={homeClicks.targetTypeFunnel}
              columns={homeFunnelColumns}
              pagination={{ pageSize: 6 }}
              locale={{ emptyText: '当前时间窗口暂无漏斗数据' }}
              scroll={{ x: 820 }}
            />
          </Col>
          <Col span={24}>
            <Table
              rowKey="key"
              style={{ marginTop: 12 }}
              title={() => '首页点击TOP目标'}
              dataSource={homeClicks.topTargets}
              columns={homeTargetColumns}
              pagination={{ pageSize: 6 }}
              locale={{ emptyText: '当前时间窗口暂无点击数据' }}
              scroll={{ x: 760 }}
            />
          </Col>
        </Row>
      </Card>

      <Card
        title={`IP防护态势（近${ipProtection.hours}小时）`}
        loading={ipLoading}
        style={{ marginTop: 24 }}
        extra={
          <Space size={8}>
            <Segmented
              options={ipHoursOptions}
              value={ipHours}
              onChange={(value) => setIpHours(Number(value) || 24)}
            />
            <InputNumber
              min={1}
              max={100000}
              value={alertThresholdInput}
              onChange={(value) => setAlertThresholdInput(Math.max(1, Number(value ?? 1)))}
              style={{ width: 120 }}
              addonBefore="阈值"
            />
            <Button onClick={() => void applyAlertThreshold()} loading={thresholdSaving} disabled={ipLoading}>
              应用阈值
            </Button>
            <Button onClick={() => void fetchIpProtection(ipHours, alertThreshold)} loading={ipLoading}>
              刷新
            </Button>
            <Button type="primary" onClick={() => void handleExportIpProtection()} loading={exporting}>
              导出CSV
            </Button>
            <Space size={4}>
              <span style={{ color: '#64748B', fontSize: 12 }}>自动刷新</span>
              <Switch checked={autoRefresh} onChange={(value) => setAutoRefresh(value)} size="small" />
            </Space>
            <Tag color={ipProtection.enabled ? 'gold' : 'default'}>
              {ipProtection.enabled ? '白名单拦截已启用' : '白名单拦截未启用'}
            </Tag>
          </Space>
        }
      >
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={6}>
            <Card size="small" loading={ipLoading}>
              <Statistic title="防护事件总数" value={ipProtection.summary.total} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small" loading={ipLoading}>
              <Statistic title="放行次数" value={ipProtection.summary.allowed} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small" loading={ipLoading}>
              <Statistic title="拦截次数" value={ipProtection.summary.blocked} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card size="small" loading={ipLoading}>
              <Statistic title="被拦截IP数" value={ipProtection.summary.uniqueBlockedIps} />
            </Card>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Card size="small" loading={ipLoading}>
              <Statistic title="白名单放行" value={ipProtection.summary.whitelistAllowed} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" loading={ipLoading}>
              <Statistic title="白名单拦截" value={ipProtection.summary.whitelistBlocked} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" loading={ipLoading}>
              <Statistic title="黑名单拦截" value={ipProtection.summary.blacklistBlocked} />
            </Card>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Card
              title={`IP防护趋势（${ipTrend.bucket === 'hour' ? '按小时' : '按天'}，阈值 ${ipTrend.alertThreshold}）`}
              size="small"
              style={{ marginBottom: 16 }}
              loading={ipLoading}
            >
              {ipTrend.alertCount > 0 && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message={`检测到 ${ipTrend.alertCount} 个异常峰值，最高拦截值 ${ipTrend.maxBlocked}`}
                  description={`异常时段：${ipTrend.alerts
                    .slice(0, 5)
                    .map((item) => item.label)
                    .join('、')}`}
                  action={
                    <Button
                      type="link"
                      onClick={() => navigate('/operations/notifications?targetType=ip_protection_alert&isRead=unread')}
                    >
                      查看告警通知
                    </Button>
                  }
                />
              )}
              {ipTrend.notification && (
                <Alert
                  type={ipTrend.notification.sent ? 'success' : 'info'}
                  showIcon
                  style={{ marginBottom: 12 }}
                  message={
                    ipTrend.notification.sent
                      ? '本轮峰值告警已发送'
                      : `本轮未发送告警（${notificationReasonLabelMap[ipTrend.notification.reason ?? ''] ?? '未触发'})`
                  }
                  description={`冷却时间：${ipTrend.notification.cooldownMinutes} 分钟${
                    ipTrend.notification.lastSentAt ? `，最近发送：${ipTrend.notification.lastSentAt}` : ''
                  }`}
                  action={
                    <Button
                      type="link"
                      onClick={() => navigate('/operations/notifications?targetType=ip_protection_alert')}
                    >
                      打开通知中心
                    </Button>
                  }
                />
              )}
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={ipTrend.points}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" minTickGap={24} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="whitelistBlocked" stackId="blocked" name="白名单拦截" fill="#F59E0B" />
                  <Bar dataKey="blacklistBlocked" stackId="blocked" name="黑名单拦截" fill="#DC2626" />
                  <Line type="monotone" dataKey="allowed" name="放行" stroke="#2563EB" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="blocked" name="拦截" stroke="#DC2626" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
              <Table
                rowKey="label"
                dataSource={ipTrend.alerts}
                columns={trendAlertColumns}
                size="small"
                style={{ marginTop: 12 }}
                pagination={{ pageSize: 6 }}
                locale={{ emptyText: '当前阈值下未发现异常峰值' }}
                scroll={{ x: 680 }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Table
              rowKey={(record) => `${record.ip}-${record.rule}`}
              title={() => '高频拦截IP'}
              dataSource={ipProtection.topBlockedIps}
              columns={topBlockedColumns}
              pagination={{ pageSize: 8 }}
            />
          </Col>
          <Col xs={24} lg={14}>
            <Table
              rowKey="id"
              title={() => '最近拦截明细'}
              dataSource={ipProtection.recentBlocked}
              columns={recentBlockedColumns}
              pagination={{ pageSize: 8 }}
              scroll={{ x: 900 }}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default DataOverviewPage;
