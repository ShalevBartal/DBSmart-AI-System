import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import { store } from './store';
import MainLayout from './components/Shared/MainLayout';
import QueueView from './components/QueueView/QueueView';
import AnalysisReviewPage from './pages/AnalysisReviewPage';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 6,
          },
        }}
      >
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/queue" replace />} />
              <Route path="/queue" element={<QueueView />} />
              <Route path="/review/:id" element={<AnalysisReviewPage />} />
              <Route path="*" element={<Navigate to="/queue" replace />} />
            </Routes>
          </MainLayout>
        </Router>
      </ConfigProvider>
    </Provider>
  );
}

export default App;
