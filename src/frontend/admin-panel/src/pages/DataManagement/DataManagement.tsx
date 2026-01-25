import React from 'react';
import { Card, Tabs } from 'antd';

const DataManagement: React.FC = () => {
  const tabItems = [
    {
      key: '1',
      label: 'GraphRAG Index Management',
      children: (
        <Card>
          <p>GraphRAG index management will be displayed here.</p>
          <p>View Index Statistics, Re-index Operations, Data Cleanup, etc.</p>
        </Card>
      ),
    },
    {
      key: '2',
      label: 'Entity Management',
      children: (
        <Card>
          <p>Entity management will be displayed here.</p>
          <p>View/Edit Entities, Entity Mapping Rules, etc.</p>
        </Card>
      ),
    },
    {
      key: '3',
      label: 'Analysis Results',
      children: (
        <Card>
          <p>Analysis results management will be displayed here.</p>
          <p>Search Analyses, View History, Export Data, etc.</p>
        </Card>
      ),
    },
    {
      key: '4',
      label: 'Backup & Restore',
      children: (
        <Card>
          <p>Backup and restore operations will be displayed here.</p>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <h1>Data Management</h1>
      <Tabs items={tabItems} defaultActiveKey="1" />
    </div>
  );
};

export default DataManagement;
