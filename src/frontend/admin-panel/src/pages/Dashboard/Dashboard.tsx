import React, { useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Alert, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setSystemHealth, setRecentJobs, setLoading } from '../../store/slices/monitoringSlice';
import { apiClient } from '../../services/apiClient';
import { JobHistory } from '../../types';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { systemHealth, recentJobs, loading } = useSelector((state: RootState) => state.monitoring);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      dispatch(setLoading(true));
      const [health, jobs] = await Promise.all([
        apiClient.getSystemHealth(),
        apiClient.getRecentJobs(10),
      ]);
      dispatch(setSystemHealth(health));
      dispatch(setRecentJobs(jobs));
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      dispatch(setLoading(false));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed': return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'running': return <SyncOutlined spin style={{ color: '#1890ff' }} />;
      default: return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const jobColumns: ColumnsType<JobHistory> = [
    {
      title: 'Job Type',
      dataIndex: 'jobType',
      key: 'jobType',
      render: (text: string) => (
        <Tag color={text.includes('indexing') ? 'blue' : 'green'}>
          {text.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span>
          {getStatusIcon(status)} {status.toUpperCase()}
        </span>
      ),
    },
    {
      title: 'Items Processed',
      dataIndex: 'itemsProcessed',
      key: 'itemsProcessed',
    },
    {
      title: 'Duration',
      dataIndex: 'durationSeconds',
      key: 'duration',
      render: (seconds?: number) => seconds ? `${seconds}s` : '-',
    },
    {
      title: 'Started At',
      dataIndex: 'startedAt',
      key: 'startedAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  if (loading && !systemHealth) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Loading system health..." />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>System Health Dashboard</h1>

      {systemHealth && systemHealth.totalErrors24h && systemHealth.totalErrors24h > 10 && (
        <Alert
          message="High Error Rate Detected"
          description={`${systemHealth.totalErrors24h} errors in the last 24 hours. Please check the logs.`}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Analyses (24h)"
              value={systemHealth?.totalAnalyses24h || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Approved (24h)"
              value={systemHealth?.approvedAnalyses24h || 0}
              suffix={`/ ${systemHealth?.totalAnalyses24h || 0}`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Reviews"
              value={systemHealth?.pendingReviews || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Overdue"
              value={systemHealth?.overdueReviews || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: systemHealth?.overdueReviews ? '#cf1322' : '#999' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Confidence Score"
              value={systemHealth?.avgConfidenceScore24h || 0}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Processing Time"
              value={systemHealth?.avgProcessingTimeMs24h || 0}
              precision={0}
              suffix="ms"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Indexing Jobs (7d)"
              value={systemHealth?.indexingJobsSuccess7d || 0}
              suffix={`/ ${(systemHealth?.indexingJobsSuccess7d || 0) + (systemHealth?.indexingJobsFailed7d || 0)}`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Analysis Jobs (7d)"
              value={systemHealth?.analysisJobsSuccess7d || 0}
              suffix={`/ ${(systemHealth?.analysisJobsSuccess7d || 0) + (systemHealth?.analysisJobsFailed7d || 0)}`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Jobs" style={{ marginTop: 24 }}>
        <Table
          columns={jobColumns}
          dataSource={recentJobs}
          rowKey="id"
          size="small"
          pagination={false}
        />
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Service Status" size="small">
            <div style={{ lineHeight: '2.5' }}>
              <div>
                {systemHealth ? (
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                ) : (
                  <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                )}
                <strong>Backend API:</strong> {systemHealth ? 'Connected' : 'Not Running'}
              </div>
              <div>
                {systemHealth ? (
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                ) : (
                  <CloseCircleOutlined style={{ color: '#d9d9d9', marginRight: 8 }} />
                )}
                <strong>GraphRAG:</strong> {systemHealth ? 'Online' : 'Unknown'}
              </div>
              <div>
                {systemHealth ? (
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                ) : (
                  <CloseCircleOutlined style={{ color: '#d9d9d9', marginRight: 8 }} />
                )}
                <strong>SQL Sentry:</strong> {systemHealth ? 'Connected' : 'Unknown'}
              </div>
              <div>
                {systemHealth ? (
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                ) : (
                  <CloseCircleOutlined style={{ color: '#d9d9d9', marginRight: 8 }} />
                )}
                <strong>Zendesk API:</strong> {systemHealth ? 'Available' : 'Unknown'}
              </div>
              <div>
                {systemHealth ? (
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                ) : (
                  <CloseCircleOutlined style={{ color: '#d9d9d9', marginRight: 8 }} />
                )}
                <strong>OpenAI API:</strong> {systemHealth ? 'Available' : 'Unknown'}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Last Execution Times" size="small">
            <div style={{ lineHeight: '2.5' }}>
              <div>
                <strong>Last Indexing:</strong>{' '}
                {systemHealth?.lastIndexingRun
                  ? new Date(systemHealth.lastIndexingRun).toLocaleString()
                  : 'Never'}
              </div>
              <div>
                <strong>Last Analysis:</strong>{' '}
                {systemHealth?.lastAnalysisRun
                  ? new Date(systemHealth.lastAnalysisRun).toLocaleString()
                  : 'Never'}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
