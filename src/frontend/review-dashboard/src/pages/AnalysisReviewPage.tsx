import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Tabs,
  Tag,
  Modal,
  Rate,
  Input,
  message,
  Descriptions,
  Divider,
  Typography,
  Spin,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setCurrentAnalysis, setIsEditing, resetEdits } from '../store/slices/analysisSlice';
import { apiClient } from '../services/apiClient';
import AnalysisDisplay from '../components/AnalysisReview/AnalysisDisplay';
import AnalysisEditor from '../components/AnalysisReview/AnalysisEditor';
import './AnalysisReviewPage.css';

const { TextArea } = Input;
const { Title, Text } = Typography;

const AnalysisReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentAnalysis, isEditing } = useSelector((state: RootState) => state.analysis);
  const [loading, setLoading] = useState(false);
  const [queueItem, setQueueItem] = useState<any>(null);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [qualityRating, setQualityRating] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadAnalysis();
  }, [id]);

  const loadAnalysis = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const item = await apiClient.getReviewQueueItem(parseInt(id));
      setQueueItem(item);
      if (item.analysis) {
        dispatch(setCurrentAnalysis(item.analysis));
      }
    } catch (error: any) {
      message.error('Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;

    try {
      if (isEditing) {
        await apiClient.updateAndApproveAnalysis(
          parseInt(id),
          currentAnalysis!,
          editNotes,
          qualityRating
        );
        message.success('Analysis updated and approved successfully');
      } else {
        await apiClient.approveAnalysis(parseInt(id), qualityRating);
        message.success('Analysis approved successfully');
      }
      navigate('/queue');
    } catch (error: any) {
      message.error('Failed to approve analysis');
    }
  };

  const handleReject = async () => {
    if (!id || !rejectionReason) {
      message.warning('Please provide a rejection reason');
      return;
    }

    try {
      await apiClient.rejectAnalysis(parseInt(id), rejectionReason);
      message.success('Analysis rejected');
      navigate('/queue');
    } catch (error: any) {
      message.error('Failed to reject analysis');
    }
  };

  if (loading || !currentAnalysis || !queueItem) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Loading analysis..." />
      </div>
    );
  }

  return (
    <div className="analysis-review-page">
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/queue')}
          style={{ marginBottom: 16 }}
        >
          Back to Queue
        </Button>

        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Title level={2}>
              Analysis Review - {currentAnalysis.ticketId}
            </Title>
          </Col>
          <Col>
            <Space>
              {!isEditing && (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => dispatch(setIsEditing(true))}
                >
                  Edit Analysis
                </Button>
              )}
              {isEditing && (
                <>
                  <Button onClick={() => {
                    dispatch(resetEdits());
                  }}>
                    Cancel Edits
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={() => dispatch(setIsEditing(false))}
                  >
                    Save Changes
                  </Button>
                </>
              )}
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => setRejectModalVisible(true)}
              >
                Reject
              </Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => setApproveModalVisible(true)}
              >
                Approve
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={3} bordered size="small">
          <Descriptions.Item label="Ticket ID">
            <strong>{currentAnalysis.ticketId}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Customer">
            {currentAnalysis.customerName}
          </Descriptions.Item>
          <Descriptions.Item label="Analysis Time">
            {new Date(currentAnalysis.analysisTimestamp).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Confidence">
            <Tag color={
              currentAnalysis.confidenceLevel === 'High' ? 'green' :
              currentAnalysis.confidenceLevel === 'Medium' ? 'orange' : 'red'
            }>
              {currentAnalysis.confidenceLevel} ({currentAnalysis.confidenceScore}%)
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Issue Type">
            {currentAnalysis.issueType}
          </Descriptions.Item>
          <Descriptions.Item label="Severity">
            <Tag color={
              currentAnalysis.severityAssessment === 'Critical' ? 'red' :
              currentAnalysis.severityAssessment === 'High' ? 'orange' : 'blue'
            }>
              {currentAnalysis.severityAssessment}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Server(s)">
            {currentAnalysis.serverNames}
          </Descriptions.Item>
          <Descriptions.Item label="Database(s)">
            {currentAnalysis.databaseNames}
          </Descriptions.Item>
          <Descriptions.Item label="Processing Time">
            {currentAnalysis.processingTimeMs}ms
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {isEditing ? (
        <AnalysisEditor />
      ) : (
        <AnalysisDisplay analysis={currentAnalysis} />
      )}

      {/* Approve Modal */}
      <Modal
        title="Approve Analysis"
        open={approveModalVisible}
        onOk={handleApprove}
        onCancel={() => setApproveModalVisible(false)}
        okText="Approve & Post to Zendesk"
      >
        <div style={{ marginBottom: 16 }}>
          <Text>Rate the quality of this analysis:</Text>
          <div style={{ marginTop: 8 }}>
            <Rate value={qualityRating} onChange={setQualityRating} />
          </div>
        </div>

        {isEditing && (
          <div>
            <Text>Edit Notes (optional):</Text>
            <TextArea
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Describe the changes you made..."
              style={{ marginTop: 8 }}
            />
          </div>
        )}

        <Divider />
        <Text type="secondary">
          This analysis will be posted as an internal note in the Zendesk ticket.
        </Text>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Reject Analysis"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => setRejectModalVisible(false)}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <Text>Reason for rejection:</Text>
        <TextArea
          rows={4}
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Explain why this analysis is being rejected..."
          style={{ marginTop: 8 }}
          required
        />
        <Divider />
        <Text type="secondary">
          This analysis will be marked as rejected and removed from the queue.
        </Text>
      </Modal>
    </div>
  );
};

export default AnalysisReviewPage;
