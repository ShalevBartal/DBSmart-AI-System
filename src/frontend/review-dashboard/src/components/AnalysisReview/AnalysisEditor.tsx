import React from 'react';
import { Card, Form, Input, Select, Tabs } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { updateEditedField } from '../../store/slices/analysisSlice';

const { TextArea } = Input;
const { Option } = Select;

const AnalysisEditor: React.FC = () => {
  const dispatch = useDispatch();
  const { editedAnalysis } = useSelector((state: RootState) => state.analysis);

  if (!editedAnalysis) return null;

  const handleChange = (field: string, value: any) => {
    dispatch(updateEditedField({ field: field as any, value }));
  };

  const tabItems = [
    {
      key: '1',
      label: 'Executive Summary',
      children: (
        <Card>
          <Form layout="vertical">
            <Form.Item label="Issue Type">
              <Input
                value={editedAnalysis.issueType}
                onChange={(e) => handleChange('issueType', e.target.value)}
              />
            </Form.Item>

            <Form.Item label="Severity Assessment">
              <Select
                value={editedAnalysis.severityAssessment}
                onChange={(value) => handleChange('severityAssessment', value)}
              >
                <Option value="Critical">Critical</Option>
                <Option value="High">High</Option>
                <Option value="Medium">Medium</Option>
                <Option value="Low">Low</Option>
              </Select>
            </Form.Item>

            <Form.Item label="Executive Summary">
              <TextArea
                rows={4}
                value={editedAnalysis.executiveSummary}
                onChange={(e) => handleChange('executiveSummary', e.target.value)}
              />
            </Form.Item>

            <Form.Item label="Confidence Level">
              <Select
                value={editedAnalysis.confidenceLevel}
                onChange={(value) => handleChange('confidenceLevel', value)}
              >
                <Option value="High">High</Option>
                <Option value="Medium">Medium</Option>
                <Option value="Low">Low</Option>
              </Select>
            </Form.Item>

            <Form.Item label="Confidence Score (%)">
              <Input
                type="number"
                min={0}
                max={100}
                value={editedAnalysis.confidenceScore}
                onChange={(e) => handleChange('confidenceScore', parseFloat(e.target.value))}
              />
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: '2',
      label: 'Symptom Analysis',
      children: (
        <Card>
          <Form layout="vertical">
            <Form.Item label="Symptom Analysis (JSON)">
              <TextArea
                rows={8}
                value={editedAnalysis.symptomAnalysisJson}
                onChange={(e) => handleChange('symptomAnalysisJson', e.target.value)}
                placeholder='{"issueType": "...", "affectedComponents": [], "severityAssessment": "..."}'
              />
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: '3',
      label: 'Data Correlations',
      children: (
        <Card>
          <Form layout="vertical">
            <Form.Item label="Data Correlations (JSON)">
              <TextArea
                rows={8}
                value={editedAnalysis.dataCorrelationsJson}
                onChange={(e) => handleChange('dataCorrelationsJson', e.target.value)}
                placeholder='[{"metric": "...", "observation": "...", "baseline": "...", "significance": "..."}]'
              />
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: '4',
      label: 'Root Cause Analysis',
      children: (
        <Card>
          <Form layout="vertical">
            <Form.Item label="Root Cause Analysis (JSON)">
              <TextArea
                rows={10}
                value={editedAnalysis.rootCauseAnalysisJson}
                onChange={(e) => handleChange('rootCauseAnalysisJson', e.target.value)}
                placeholder='{"primaryCause": "...", "contributingFactors": [], "evidence": []}'
              />
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: '5',
      label: 'Remediation',
      children: (
        <Card>
          <Form layout="vertical">
            <Form.Item label="Immediate Remediation (JSON)">
              <TextArea
                rows={10}
                value={editedAnalysis.immediateRemediationJson}
                onChange={(e) => handleChange('immediateRemediationJson', e.target.value)}
                placeholder='{"steps": [{"action": "...", "riskLevel": "..."}], "estimatedImpact": "..."}'
              />
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: '6',
      label: 'Prevention',
      children: (
        <Card>
          <Form layout="vertical">
            <Form.Item label="Prevention Recommendations (JSON)">
              <TextArea
                rows={8}
                value={editedAnalysis.preventionRecommendationsJson}
                onChange={(e) => handleChange('preventionRecommendationsJson', e.target.value)}
                placeholder='{"shortTerm": [], "longTerm": []}'
              />
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: '7',
      label: 'Similar Tickets',
      children: (
        <Card>
          <Form layout="vertical">
            <Form.Item label="Similar Tickets (JSON)">
              <TextArea
                rows={8}
                value={editedAnalysis.similarTicketsJson}
                onChange={(e) => handleChange('similarTicketsJson', e.target.value)}
                placeholder='[{"ticketId": "...", "resolution": "...", "relevance": "..."}]'
              />
            </Form.Item>
          </Form>
        </Card>
      ),
    },
  ];

  return (
    <div className="analysis-editor">
      <Tabs items={tabItems} defaultActiveKey="1" />
    </div>
  );
};

export default AnalysisEditor;
