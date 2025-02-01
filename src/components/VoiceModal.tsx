import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

export const LoadingModalContent: React.FC = () => (
  <div style={{ textAlign: 'center', padding: '20px' }}>
    <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
    <p style={{ marginTop: 16 }}>请稍候...</p>
  </div>
);
