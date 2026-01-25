import React from 'react';
import { Card, Tabs } from 'antd';

const Configuration: React.FC = () => {
  const tabItems = [
    {
      key: '1',
      label: 'GraphRAG Settings',
      children: (
        <Card>
          <p>GraphRAG configuration settings will be displayed here.</p>
          <p>Similarity Threshold, Indexing Schedule, Search Scope, etc.</p>
        </Card>
      ),
    },
    {
      key: '2',
      label: 'AI Analysis Settings',
      children: (
        <Card>
          <p>AI Analysis configuration settings will be displayed here.</p>
          <p>Confidence Score Weights, SQL Sentry Time Window, OpenAI Parameters, etc.</p>
        </Card>
      ),
    },
    {
      key: '3',
      label: 'Pipeline Schedules',
      children: (
        <Card>
          <p>Pipeline schedule configuration will be displayed here.</p>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <h1>System Configuration</h1>
      <Tabs items={tabItems} defaultActiveKey="1" />
    </div>
  );
};

export default Configuration;
