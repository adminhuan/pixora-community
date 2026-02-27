import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Alert, Card, Col, Row, message } from 'antd';
import { adminCommentApi } from '../../api/admin';
import { extractData, extractList, getErrorMessage } from '../../utils/api';
import { HandleReportModal } from './components/HandleReportModal';
import { ReportDetail } from './components/ReportDetail';
import { ReportTable } from './components/ReportTable';

const getDisplayName = (value: unknown, fallback = '-') => {
  if (!value || typeof value !== 'object') {
    return fallback;
  }

  const record = value as Record<string, unknown>;
  const nickname = String(record.nickname ?? '').trim();
  const username = String(record.username ?? '').trim();

  if (nickname) {
    return nickname;
  }
  if (username) {
    return username;
  }

  return fallback;
};

const formatDateTime = (value: unknown) => {
  const text = String(value ?? '').trim();
  return text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-';
};

const ReportManagePage = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [stats, setStats] = useState<Record<string, number>>({});
  const [data, setData] = useState<Array<Record<string, unknown>>>([]);

  const fetchReports = useCallback(async (preferredId?: string) => {
    setLoading(true);
    setError('');

    try {
      const [reportRes, statsRes] = await Promise.all([adminCommentApi.reports(), adminCommentApi.reportStats()]);
      const list = extractList<Record<string, unknown>>(reportRes).map((item) => {
        const reportId = String(item.id ?? '');
        const comment =
          item.comment && typeof item.comment === 'object' ? (item.comment as Record<string, unknown>) : null;
        const source = item.source && typeof item.source === 'object' ? (item.source as Record<string, unknown>) : null;

        const targetType = String(item.targetType ?? '');
        const targetId = String(item.targetId ?? '');
        const reporterName = String(item.reporterName ?? getDisplayName(item.reporter, String(item.reporterId ?? '-')));
        const reportedUserName = String(
          item.reportedUserName ??
            getDisplayName(item.targetAuthor, getDisplayName(comment?.author, String(item.targetAuthorId ?? '-'))),
        );
        const targetSummary = String(
          item.targetSummary ?? comment?.content ?? source?.title ?? `${targetType}#${targetId}`,
        ).slice(0, 90);

        return {
          ...item,
          id: reportId,
          key: reportId,
          reporterName,
          reportedUserName,
          targetSummary,
          createdAtText: formatDateTime(item.createdAt),
          handledAtText: formatDateTime(item.handledAt),
        } as Record<string, unknown>;
      });

      const normalized = list.filter((item) => String(item.id ?? item.key ?? '').trim());
      setData(normalized);
      setStats(extractData<Record<string, number>>(statsRes, {}));
      setSelectedId((current) => {
        if (!normalized.length) {
          return '';
        }

        if (preferredId && normalized.some((item) => String(item.id ?? item.key ?? '') === preferredId)) {
          return preferredId;
        }

        if (current && normalized.some((item) => String(item.id ?? item.key ?? '') === current)) {
          return current;
        }

        return String(normalized[0].id ?? normalized[0].key ?? '');
      });
    } catch (err) {
      setError(getErrorMessage(err, '举报数据加载失败'));
      setData([]);
      setSelectedId('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const selectedItem = useMemo(
    () => data.find((item) => String(item.id ?? item.key ?? '') === selectedId) ?? null,
    [data, selectedId],
  );

  return (
    <Row gutter={[12, 12]}>
      <Col span={24} lg={16}>
        <Card title="举报管理" loading={loading}>
          {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}
          <ReportTable
            data={data}
            loading={loading}
            selectedId={selectedId}
            onSelect={(item) => {
              setSelectedId(String(item.id ?? item.key ?? ''));
            }}
            onHandle={(item) => {
              setSelectedId(String(item.id ?? item.key ?? ''));
              setOpen(true);
            }}
          />
        </Card>
      </Col>
      <Col span={24} lg={8}>
        <ReportDetail item={selectedItem} />
        <Card title="举报统计" style={{ marginTop: 12 }}>
          <p>总数：{stats.total ?? 0}</p>
          <p>待处理：{stats.pending ?? 0}</p>
          <p>已处理：{stats.resolved ?? 0}</p>
          <p>已驳回：{stats.rejected ?? 0}</p>
        </Card>
      </Col>
      <HandleReportModal
        open={open}
        loading={submitting}
        onCancel={() => {
          setOpen(false);
        }}
        onOk={async (payload) => {
          if (!selectedId) {
            message.warning('请先选择需要处理的举报');
            return;
          }

          setSubmitting(true);
          try {
            await adminCommentApi.handleReport(selectedId, payload);
            message.success('举报处理成功');
            setOpen(false);
            await fetchReports(selectedId);
          } catch (err) {
            message.error(getErrorMessage(err, '举报处理失败'));
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </Row>
  );
};

export default ReportManagePage;
