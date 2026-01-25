import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import { store } from './store';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import Configuration from './pages/Configuration/Configuration';
import ManualTriggers from './pages/ManualTriggers/ManualTriggers';
import Monitoring from './pages/Monitoring/Monitoring';
import DataManagement from './pages/DataManagement/DataManagement';
import Logs from './pages/Logs/Logs';
import Alerts from './pages/Alerts/Alerts';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#722ed1',
            borderRadius: 6,
          },
        }}
      >
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/configuration" element={<Configuration />} />
              <Route path="/triggers" element={<ManualTriggers />} />
              <Route path="/monitoring" element={<Monitoring />} />
              <Route path="/data" element={<DataManagement />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </MainLayout>
        </Router>
      </ConfigProvider>
    </Provider>
  );
}

export default App;
