import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Select, Input, Card, Statistic, Row, Col } from 'antd';
import { EyeOutlined, ClockCircleOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { ColumnsType } from 'antd/es/table';
import { ReviewQueueDashboardView } from '../../types';
import { setQueueItems, setLoading, setError, setFilters } from '../../store/slices/queueSlice';
import { RootState } from '../../store';
import { apiClient } from '../../services/apiClient';
import './QueueView.css';

const { Option } = Select;
const { Search } = Input;

const QueueView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, loading, filters } = useSelector((state: RootState) => state.queue);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    loadQueue();
  }, [filters, currentPage, pageSize]);

  const loadQueue = async () => {
    try {
      dispatch(setLoading(true));
      const response = await apiClient.getReviewQueue({
        ...filters,
        page: currentPage,
        pageSize,
      });
      dispatch(setQueueItems(response.items));
      setTotal(response.total);
    } catch (error: any) {
      dispatch(setError(error.message || 'Failed to load queue'));
    }
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'High': return 'green';
      case 'Medium': return 'orange';
      case 'Low': return 'red';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'Critical': return 'red';
      case 'High': return 'orange';
      case 'Medium': return 'blue';
      case 'Low': return 'green';
      default: return 'default';
    }
  };

  const getSLAStatusColor = (status: string) => {
    switch (status) {
      case 'Overdue': return 'red';
      case 'Due Soon': return 'orange';
      case 'On Time': return 'green';
      default: return 'default';
    }
  };

  const columns: ColumnsType<ReviewQueueDashboardView> = [
    {
      title: 'Ticket ID',
      dataIndex: 'ticketId',
      key: 'ticketId',
      width: 120,
      fixed: 'left',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Customer',
      dataIndex: ['analysis', 'customerName'],
      key: 'customer',
      width: 180,
    },
    {
      title: 'Issue Type',
      dataIndex: ['analysis', 'issueType'],
      key: 'issueType',
      width: 120,
    },
    {
      title: 'Severity',
      dataIndex: ['analysis', 'severityAssessment'],
      key: 'severity',
      width: 100,
      render: (severity: string) => (
        <Tag color={getSeverityColor(severity)}>{severity}</Tag>
      ),
    },
    {
      title: 'Confidence',
      dataIndex: ['analysis', 'confidenceLevel'],
      key: 'confidence',
      width: 120,
      render: (level: string, record: ReviewQueueDashboardView) => (
        <Space>
          <Tag color={getConfidenceColor(level)}>{level}</Tag>
          {record.analysis?.confidenceScore && (
            <span style={{ fontSize: '12px', color: '#666' }}>
              {record.analysis.confidenceScore}%
            </span>
          )}
        </Space>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const color = priority === 'urgent' ? 'red' : priority === 'high' ? 'orange' : 'default';
        return <Tag color={color}>{priority.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'SLA Status',
      dataIndex: 'slaStatus',
      key: 'slaStatus',
      width: 120,
      render: (status: string) => (
        <Tag color={getSLAStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Age',
      dataIndex: 'ageMinutes',
      key: 'age',
      width: 100,
      render: (minutes: number) => {
        if (minutes < 60) return `${minutes}m`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
        return `${Math.floor(minutes / 1440)}d`;
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: any, record: ReviewQueueDashboardView) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/review/${record.id}`)}
        >
          Review
        </Button>
      ),
    },
  ];

  const statsData = {
    total: items.length,
    overdue: items.filter(i => i.slaStatus === 'Overdue').length,
    pending: items.filter(i => i.queueStatus === 'pending').length,
    inReview: items.filter(i => i.queueStatus === 'in_review').length,
  };

  return (
    <div className="queue-view">
      <h1>Review Queue</h1>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total in Queue"
              value={statsData.total}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Overdue"
              value={statsData.overdue}
              valueStyle={{ color: '#cf1322' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending"
              value={statsData.pending}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="In Review"
              value={statsData.inReview}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <Select
            placeholder="Filter by Status"
            style={{ width: 200 }}
            allowClear
            onChange={(value) => dispatch(setFilters({ ...filters, status: value }))}
          >
            <Option value="pending">Pending</Option>
            <Option value="in_review">In Review</Option>
            <Option value="approved">Approved</Option>
            <Option value="rejected">Rejected</Option>
          </Select>

          <Select
            placeholder="Filter by Priority"
            style={{ width: 200 }}
            allowClear
            onChange={(value) => dispatch(setFilters({ ...filters, priority: value }))}
          >
            <Option value="urgent">Urgent</Option>
            <Option value="high">High</Option>
            <Option value="normal">Normal</Option>
            <Option value="low">Low</Option>
          </Select>

          <Search
            placeholder="Search by customer"
            style={{ width: 250 }}
            allowClear
            onSearch={(value) => dispatch(setFilters({ ...filters, customer: value }))}
          />

          <Button onClick={loadQueue}>Refresh</Button>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={items}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          current: currentPage,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
          onChange: (page, pageSize) => {
            setCurrentPage(page);
            setPageSize(pageSize);
          },
        }}
      />
    </div>
  );
};

export default QueueView;
