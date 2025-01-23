import { App as AntApp, ConfigProvider, theme } from 'antd';
import Chat from './components/Chat';

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <AntApp>
        <div style={{ padding: 20 }}>
          <Chat />
        </div>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
