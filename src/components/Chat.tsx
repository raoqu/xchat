import { CloudUploadOutlined, EnterOutlined, LinkOutlined, UserOutlined } from '@ant-design/icons';
import { Attachments, Bubble, AttachmentsProps, Sender, useXChat, useXAgent, XRequest } from '@ant-design/x';
import { App, Button, Flex, Space, Switch, Typography, type GetProp, type GetRef } from 'antd';
import React from 'react';

const roles: GetProp<typeof Bubble.List, 'roles'> = {
  ai: {
    placement: 'start',
    avatar: { icon: <UserOutlined />, style: { background: '#fde3cf' } },
  },
  local: {
    placement: 'end',
    avatar: { icon: <UserOutlined />, style: { background: '#87d068' } },
  },
};

const Chat: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [attachItems, setAttachItems] = React.useState<GetProp<AttachmentsProps, 'items'>>([]);
  const [text, setText] = React.useState('');
  const [hasRef, setHasRef] = React.useState(true);
  const { message } = App.useApp();
  const [recording, setRecording] = React.useState(false);

  const { create } = XRequest({
    baseURL: '/v1/chat/completions',
    dangerouslyApiKey: "******",
    model: 'qwen',
  });

  const [agent] = useXAgent({
    request: async (info, callbacks) => {
      const { message } = info;
      const { onUpdate } = callbacks;

      try {
        create(
          {
            messages: [{ role: 'user', content: message }],
            stream: true,
          },
          {
            onUpdate: (chunk:any) => {
              try {
                const data = JSON.parse(chunk.data);
                const content = data?.choices?.[0]?.delta?.content;
                if (content) {
                  console.log(content);
                  onUpdate(content);
                }
              } catch (e) {
                // Ignore invalid JSON data
                console.debug('Invalid JSON data:', chunk.data);
              }
            },
            onSuccess: (chunks:any[]) => {},
            onError: (error:Error) => {}
          },
        );
      } catch (error) {
        console.error(error);
      }
    },
  });
  const { messages, onRequest } = useXChat({ agent });
  const items = messages.map(({ message, id }) => ({
    key: id,
    content: message,
  }));


  const headerNode = (
    <Sender.Header
      open={hasRef}
      title={
        <Space>
          <EnterOutlined />
          <Typography.Text type="secondary">"Tell more about Ant Design X"</Typography.Text>
        </Space>
      }
      onOpenChange={setHasRef}
    />
  );

  const attachmentsRef = React.useRef<GetRef<typeof Attachments>>(null);

  const senderRef = React.useRef<GetRef<typeof Sender>>(null);

  const senderHeader = (
    <Sender.Header title="Attachments"
      styles={{
        content: {
          padding: 0,
        },
      }}
      open={open}
      onOpenChange={setOpen}
      forceRender
    >
      <Attachments ref={attachmentsRef}
        // Mock not real upload file
        beforeUpload={() => false}
        items={attachItems}
        onChange={({ fileList }) => setAttachItems(fileList)}
        placeholder={(type) =>
          type === 'drop' ? {  title: 'Drop file here',} : 
            { icon: <CloudUploadOutlined />, title: 'Upload files', description: 'Click or drag files to this area to upload', }
        }
        getDropContainer={() => senderRef.current?.nativeElement}
      />
    </Sender.Header>
  );

  return (
    <div style={{ height: '100%', maxWidth: 1200, margin: '0 auto' }}>
    <Flex vertical gap="middle" align="flex-start" style={{  margin: '0 auto' }}>
      <Bubble.List 
        roles={roles} 
        items={messages.map(({ id, message, status }) => ({
          key: id,
          role: status === 'local' ? 'local' : 'ai',
          content: message,
        }))}
      />
      <Switch
        checked={hasRef}
        onChange={() => setHasRef(!hasRef)}
        checkedChildren="With Reference"
        unCheckedChildren="With Reference"
      />
      <Sender
        ref={senderRef}
        header={senderHeader}
        open={open}
        prefix={
          <Button
            type="text"
            icon={<LinkOutlined />}
            onClick={() => {
              setOpen(!open);
            }}
          />
        }
        value={text}
        onChange={setText}
        onPasteFile={(file) => {
          attachmentsRef.current?.upload(file);
          setOpen(true);
        }}
        placeholder="← 点击展开文件上传区域"
        onSubmit={(msg) => {
          onRequest(msg)
          setAttachItems([]);
          setText('');
        }}
        allowSpeech={{
          // When setting `recording`, the built-in speech recognition feature will be disabled
          recording,
          onRecordingChange: (nextRecording) => {
            // message.info(`Mock Customize Recording: ${nextRecording}`);
            setRecording(nextRecording);
          },
        }}
      />
    </Flex>
    </div>
  );
};

export default Chat;
