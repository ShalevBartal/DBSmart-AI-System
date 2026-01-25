import React from 'react';
import { Card, Table, Tag, Button, Space, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';

interface AlertType {
  id: number;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source: string;
  acknowledged: boolean;
}

const Alerts: React.FC = () => {
  const columns: ColumnsType<AlertType> = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 120,
      render: (severity: string) => {
        const color =
          severity === 'critical' ? 'red' :
          severity === 'error' ? 'orange' :
          severity === 'warning' ? 'gold' : 'blue';
        return <Tag color={color}>{severity.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      width: 150,
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      render: (_: any, record: AlertType) => (
        <Space>
          {!record.acknowledged && (
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
            >
              Acknowledge
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <BellOutlined /> Active Alerts
        </span>
      ),
      children: (
        <Card>
          <Table
            columns={columns}
            dataSource={[]}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 20 }}
          />
        </Card>
      ),
    },
    {
      key: '2',
      label: 'Alert Configuration',
      children: (
        <Card>
          <p>Alert configuration will be displayed here.</p>
          <p>Configure alert thresholds, notification channels, etc.</p>
        </Card>
      ),
    },
    {
      key: '3',
      label: 'Alert History',
      children: (
        <Card>
          <p>Alert history will be displayed here.</p>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <h1>Alerts & Notifications</h1>
      <Tabs items={tabItems} defaultActiveKey="1" />
    </div>
  );
};

export default Alerts;
