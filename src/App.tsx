import { ConfigProvider, theme } from 'antd';
import Chat from './components/Chat';

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <div style={{ padding: 20 }}>
        <Chat />
      </div>
    </ConfigProvider>
  );
}

export default App;
