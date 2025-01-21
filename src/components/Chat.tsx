import { CloudUploadOutlined, CopyOutlined, EnterOutlined, LinkOutlined, UserOutlined, VerticalAlignBottomOutlined } from '@ant-design/icons';
import { Attachments, Bubble, AttachmentsProps, Sender, useXChat, useXAgent, XRequest } from '@ant-design/x';
import { App, Button, Flex, Space, Switch, Typography, type GetProp, type GetRef } from 'antd';
import React from 'react';
import './chat.css';

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
  const responseTextRef = React.useRef('');
  const [hasRef, setHasRef] = React.useState(true);
  const { message: appMessage } = App.useApp();
  const [recording, setRecording] = React.useState(false);
  const bubbleContainerRef = React.useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = React.useState(true);
  const [showScrollButton, setShowScrollButton] = React.useState(false);

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
        responseTextRef.current = ''; // Reset response text at the start of each request
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
                  responseTextRef.current += content;
                  console.log(content);
                  onUpdate(responseTextRef.current);
                }
              } catch (e) {
                // Ignore invalid JSON data
                console.debug('Invalid JSON data:', chunk.data);
              }
            },
            onSuccess: (chunks:any[]) => {
              appMessage.success('成功');
            },
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

  const isScrolledToBottom = () => {
    if (!bubbleContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = bubbleContainerRef.current;
    // Consider "almost" at bottom (within 10px) as at bottom
    return scrollHeight - scrollTop - clientHeight < 10;
  };

  const scrollToBottom = () => {
    if (bubbleContainerRef.current) {
      bubbleContainerRef.current.scrollTop = bubbleContainerRef.current.scrollHeight;
      setShouldAutoScroll(true);
      setShowScrollButton(false);
    }
  };

  const handleScroll = () => {
    const atBottom = isScrolledToBottom();
    setShouldAutoScroll(atBottom);
    setShowScrollButton(!atBottom);
  };

  React.useEffect(() => {
    if (shouldAutoScroll && bubbleContainerRef.current) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

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
    <div className="chat-container">
      <div 
        ref={bubbleContainerRef}
        className="chat-messages"
        onScroll={handleScroll}
      >
        <Bubble.List 
          roles={roles} 
          items={messages.map(({ id, message, status }) => ({
            key: id,
            role: status === 'local' ? 'local' : 'ai',
            content: (
              <div className="bubble-item-wrapper">
                {message}
                <Button
                  className="copy-button"
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(message).then(() => {
                      // appMessage.success('已复制到剪贴板');
                    });
                  }}
                />
              </div>
            ),
          }))}
        />
      </div>
      {showScrollButton && (
        <Button
          type="primary"
          shape="circle"
          icon={<VerticalAlignBottomOutlined />}
          onClick={scrollToBottom}
          className="scroll-to-bottom"
        />
      )}
      <div className="chat-input-container">
        <Flex vertical gap="middle" align="flex-start">
          {/* <Switch
            checked={hasRef}
            onChange={() => setHasRef(!hasRef)}
            checkedChildren="With Reference"
            unCheckedChildren="With Reference"
          /> */}
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
              recording,
              onRecordingChange: (nextRecording) => {
                setRecording(nextRecording);
              },
            }}
          />
        </Flex>
      </div>
    </div>
  );
};

export default Chat;
