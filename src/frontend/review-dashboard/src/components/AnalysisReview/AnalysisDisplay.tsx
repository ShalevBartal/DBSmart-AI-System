import React from 'react';
import { Card, Tabs, Typography, Tag, List, Collapse, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ExperimentOutlined,
  BulbOutlined,
  ToolOutlined,
  SafetyOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { Analysis } from '../../types';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

interface AnalysisDisplayProps {
  analysis: Analysis;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis }) => {
  const parseJson = (jsonString?: string) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  };

  const symptomAnalysis = parseJson(analysis.symptomAnalysisJson);
  const dataCorrelations = parseJson(analysis.dataCorrelationsJson);
  const rootCauseAnalysis = parseJson(analysis.rootCauseAnalysisJson);
  const immediateRemediation = parseJson(analysis.immediateRemediationJson);
  const preventionRecommendations = parseJson(analysis.preventionRecommendationsJson);
  const similarTickets = parseJson(analysis.similarTicketsJson);

  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <ExperimentOutlined /> Executive Summary
        </span>
      ),
      children: (
        <Card>
          <Title level={4}>Executive Summary</Title>
          <Paragraph style={{ fontSize: '16px', lineHeight: '1.8' }}>
            {analysis.executiveSummary}
          </Paragraph>
        </Card>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <BulbOutlined /> Root Cause Analysis
        </span>
      ),
      children: (
        <div>
          {symptomAnalysis && (
            <Card style={{ marginBottom: 16 }}>
              <Title level={4}>Symptom Analysis</Title>
              <Paragraph>
                <strong>Issue Type:</strong> {symptomAnalysis.issueType}
              </Paragraph>
              <Paragraph>
                <strong>Affected Components:</strong>{' '}
                {symptomAnalysis.affectedComponents?.map((comp: string, idx: number) => (
                  <Tag key={idx} color="blue">
                    {comp}
                  </Tag>
                ))}
              </Paragraph>
              <Paragraph>
                <strong>Severity Assessment:</strong>{' '}
                <Tag color={
                  symptomAnalysis.severityAssessment === 'Critical' ? 'red' :
                  symptomAnalysis.severityAssessment === 'High' ? 'orange' : 'blue'
                }>
                  {symptomAnalysis.severityAssessment}
                </Tag>
              </Paragraph>
            </Card>
          )}

          {dataCorrelations && (
            <Card style={{ marginBottom: 16 }}>
              <Title level={4}>Data Correlations</Title>
              <List
                dataSource={dataCorrelations}
                renderItem={(item: any) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Text strong>{item.metric}</Text>}
                      description={
                        <div>
                          <Paragraph><strong>Observation:</strong> {item.observation}</Paragraph>
                          <Paragraph><strong>Baseline:</strong> {item.baseline}</Paragraph>
                          <Paragraph><strong>Significance:</strong> {item.significance}</Paragraph>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          {rootCauseAnalysis && (
            <Card>
              <Title level={4}>Root Cause Analysis</Title>
              <Paragraph>
                <strong>Primary Cause:</strong>
                <br />
                {rootCauseAnalysis.primaryCause}
              </Paragraph>
              <Paragraph>
                <strong>Contributing Factors:</strong>
              </Paragraph>
              <List
                size="small"
                dataSource={rootCauseAnalysis.contributingFactors}
                renderItem={(item: string) => <List.Item>{item}</List.Item>}
              />
              <Paragraph style={{ marginTop: 16 }}>
                <strong>Evidence:</strong>
              </Paragraph>
              <List
                size="small"
                dataSource={rootCauseAnalysis.evidence}
                renderItem={(item: string) => <List.Item>• {item}</List.Item>}
              />
            </Card>
          )}
        </div>
      ),
    },
    {
      key: '3',
      label: (
        <span>
          <ToolOutlined /> Remediation
        </span>
      ),
      children: immediateRemediation && (
        <Card>
          <Title level={4}>Immediate Remediation Steps</Title>
          <List
            dataSource={immediateRemediation.steps}
            renderItem={(item: any, index: number) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Text strong>{index + 1}.</Text>}
                  title={item.action}
                  description={
                    <Tag color={
                      item.riskLevel === 'High' ? 'red' :
                      item.riskLevel === 'Medium' ? 'orange' : 'green'
                    }>
                      Risk: {item.riskLevel}
                    </Tag>
                  }
                />
              </List.Item>
            )}
          />
          <Paragraph style={{ marginTop: 16 }}>
            <strong>Estimated Impact:</strong> {immediateRemediation.estimatedImpact}
          </Paragraph>
        </Card>
      ),
    },
    {
      key: '4',
      label: (
        <span>
          <SafetyOutlined /> Prevention
        </span>
      ),
      children: preventionRecommendations && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <Title level={4}>Short-term Recommendations</Title>
            <List
              dataSource={preventionRecommendations.shortTerm}
              renderItem={(item: string) => <List.Item>• {item}</List.Item>}
            />
          </Card>
          <Card>
            <Title level={4}>Long-term Recommendations</Title>
            <List
              dataSource={preventionRecommendations.longTerm}
              renderItem={(item: string) => <List.Item>• {item}</List.Item>}
            />
          </Card>
        </div>
      ),
    },
    {
      key: '5',
      label: (
        <span>
          <LinkOutlined /> Similar Tickets
        </span>
      ),
      children: similarTickets && (
        <Card>
          <Title level={4}>Similar Historical Tickets</Title>
          <List
            dataSource={similarTickets}
            renderItem={(item: any) => (
              <List.Item>
                <List.Item.Meta
                  title={<Text strong>{item.ticketId}</Text>}
                  description={
                    <div>
                      <Paragraph><strong>Resolution:</strong> {item.resolution}</Paragraph>
                      <Paragraph><strong>Relevance:</strong> {item.relevance}</Paragraph>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
  ];

  return (
    <div className="analysis-display">
      <Tabs items={tabItems} defaultActiveKey="1" />
    </div>
  );
};

export default AnalysisDisplay;
