import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography } from 'antd';
import { UserOutlined, LogoutOutlined, BellOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './MainLayout.css';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      // Handle logout
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#001529',
        padding: '0 24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            color: '#fff',
            fontSize: '20px',
            fontWeight: 'bold',
            marginRight: '40px'
          }}>
            DBSmart AI - Review Queue
          </div>
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['queue']}
            style={{ flex: 1, minWidth: 0 }}
            items={[
              {
                key: 'queue',
                label: 'Review Queue',
                onClick: () => navigate('/queue'),
              },
            ]}
          />
        </div>
        <Space size="large">
          <BellOutlined style={{ fontSize: '18px', color: '#fff', cursor: 'pointer' }} />
          <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <Text style={{ color: '#fff' }}>DBChief</Text>
            </Space>
          </Dropdown>
        </Space>
      </Header>
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <div style={{
          background: '#fff',
          padding: '24px',
          minHeight: 'calc(100vh - 134px)',
          borderRadius: '8px'
        }}>
          {children}
        </div>
      </Content>
      <Footer style={{ textAlign: 'center', background: '#f0f2f5' }}>
        DBSmart AI Ticket Analysis System ©2026
      </Footer>
    </Layout>
  );
};

export default MainLayout;
