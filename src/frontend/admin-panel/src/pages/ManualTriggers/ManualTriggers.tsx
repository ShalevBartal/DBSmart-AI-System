import React from 'react';
import { Card, Button, Space, Row, Col } from 'antd';
import { PlayCircleOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';

const ManualTriggers: React.FC = () => {
  return (
    <div>
      <h1>Manual Triggers</h1>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="GraphRAG Indexing" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" icon={<PlayCircleOutlined />} block>
                Trigger Full Indexing
              </Button>
              <Button icon={<ReloadOutlined />} block>
                Incremental Update
              </Button>
              <p style={{ marginTop: 16, fontSize: '12px', color: '#666' }}>
                Manually start GraphRAG indexing job
              </p>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="AI Analysis" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" icon={<ThunderboltOutlined />} block>
                Force Re-Analysis
              </Button>
              <p style={{ marginTop: 16, fontSize: '12px', color: '#666' }}>
                Trigger analysis for specific tickets
              </p>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Test Functions" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block>Test SQL Sentry Connection</Button>
              <Button block>Test Zendesk API</Button>
              <Button block>Test OpenAI API</Button>
              <Button block>Test GraphRAG Query</Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ManualTriggers;
