import React from 'react';
import { Card, Row, Col, Statistic, Tabs } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';

const Monitoring: React.FC = () => {
  const tabItems = [
    {
      key: '1',
      label: 'GraphRAG Performance',
      children: (
        <Card>
          <p>GraphRAG performance metrics will be displayed here.</p>
          <p>Index Statistics, Query Performance, Similarity Quality, etc.</p>
        </Card>
      ),
    },
    {
      key: '2',
      label: 'AI Analysis Quality',
      children: (
        <Card>
          <p>AI Analysis quality metrics will be displayed here.</p>
          <p>Approval Rates, Confidence Distribution, Processing Time, etc.</p>
        </Card>
      ),
    },
    {
      key: '3',
      label: 'Cost Tracking',
      children: (
        <Card>
          <p>Cost tracking information will be displayed here.</p>
          <p>Azure Service Costs, Usage Trends, Budget Alerts, etc.</p>
        </Card>
      ),
    },
    {
      key: '4',
      label: 'Business Impact',
      children: (
        <Card>
          <p>Business impact metrics will be displayed here.</p>
          <p>Tickets Analyzed, Time Saved, Top Issues, etc.</p>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <h1>Monitoring & Analytics</h1>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Analyses (Month)"
              value={0}
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Approval Rate"
              value={0}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Monthly Cost"
              value={0}
              prefix="$"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Time Saved (Hours)"
              value={0}
            />
          </Card>
        </Col>
      </Row>

      <Tabs items={tabItems} defaultActiveKey="1" />
    </div>
  );
};

export default Monitoring;
