import { CloudUploadOutlined, CopyOutlined, EnterOutlined, LinkOutlined, LoadingOutlined, MenuOutlined, SettingOutlined, SoundOutlined, UserOutlined, VerticalAlignBottomOutlined, AudioOutlined, RobotOutlined, TranslationOutlined, EditOutlined, FileSearchOutlined } from '@ant-design/icons';
import { Attachments, Bubble, AttachmentsProps, Sender, useXChat, useXAgent, XRequest } from '@ant-design/x';
import { App, Button, Dropdown, Flex, Menu, Modal, Space, Spin, Switch, Typography, type GetProp, type GetRef } from 'antd';
import React from 'react';
import './chat.css';
import { VOICE_OPTIONS, VoicePlayer, VoiceOption } from './Voice';

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
  const MODEL_OPTIONS = {
    'qwen': '通义千问',
    'gpt-4': 'GPT-4',
    'gpt-3.5-turbo': 'GPT-3.5',
  } as const;

  const createMenuItems = <T extends string>(
    options: Record<T, string>,
    selectedValue: T,
    onSelect: (value: T) => void
  ) => {
    return Object.entries(options).map(([value, label]) => {
      if (label === '---') {
        return { type: 'divider' };
      }
      return {
        key: value,
        label: (
          <Space>
            <span>{label}</span>
            {selectedValue === value && <span style={{ color: '#1890ff' }}>✓</span>}
          </Space>
        ),
        onClick: () => onSelect(value as T),
      };
    });
  };

  const [open, setOpen] = React.useState(false);
  const [attachItems, setAttachItems] = React.useState<GetProp<AttachmentsProps, 'items'>>([]);
  const [text, setText] = React.useState('');
  const responseTextRef = React.useRef('');
  const [hasRef, setHasRef] = React.useState(true);
  const { message: appMessage, modal } = App.useApp();
  const [recording, setRecording] = React.useState(false);
  const bubbleContainerRef = React.useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = React.useState(true);
  const [showScrollButton, setShowScrollButton] = React.useState(false);
  const [playingMessageId, setPlayingMessageId] = React.useState<string | null>(null);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [showAudioModal, setShowAudioModal] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [selectedVoice, setSelectedVoice] = React.useState<VoiceOption>('1aacaeb1b840436391b835fd5513f4c4');
  const [selectedModel, setSelectedModel] = React.useState<keyof typeof MODEL_OPTIONS>('qwen');

  const voicePlayer = React.useMemo(() => new VoicePlayer(audioRef, appMessage), [appMessage]);

  const { create } = XRequest({
    baseURL: '/v1/chat/completions',
    dangerouslyApiKey: "******",
    model: selectedModel,
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

  const playAudio = async (url: string) => {
    try {
      await voicePlayer.playAudio(url);
      setIsPlaying(true);
    } catch (error) {
      setIsPlaying(false);
    }
  };

  const handleSpeak = async (text: string, messageId: string) => {
    try {
      setPlayingMessageId(messageId);
      const url = await voicePlayer.handleSpeak(text, selectedVoice);
      setAudioUrl(url);
      setShowAudioModal(true);
      await playAudio(url);
    } catch (error) {
      console.error('Failed to handle speak:', error);
    } finally {
      setPlayingMessageId(null);
    }
  };

  const voiceMenu = (
    <Menu
      style={{ maxHeight: '400px', overflowY: 'auto' }}
      items={createMenuItems(
        VOICE_OPTIONS,
        selectedVoice,
        setSelectedVoice
      )}
    />
  );

  const settingsMenu = (
    <Menu
      items={[
        {
          key: 'llm',
          label: 'LLM设置',
          children: createMenuItems(
            MODEL_OPTIONS,
            selectedModel,
            setSelectedModel
          ),
        },
      ]}
    />
  );

  interface ToolbarStatus {
    robot: boolean;
    translate: boolean;
    edit: boolean;
    search: boolean;
  }

  const [toolbarStatus, setToolbarStatus] = React.useState<ToolbarStatus>({
    robot: false,
    translate: false,
    edit: false,
    search: false
  });

  const toggleIcon = (iconKey: keyof ToolbarStatus) => {
    setToolbarStatus(prev => ({
      ...prev,
      [iconKey]: !prev[iconKey]
    }));
  };

  const iconButtons = [
    { key: 'robot' as const, icon: <RobotOutlined />, tooltip: 'AI Assistant' },
    { key: 'translate' as const, icon: <TranslationOutlined />, tooltip: 'Translate' },
    { key: 'edit' as const, icon: <EditOutlined />, tooltip: 'Edit' },
    { key: 'search' as const, icon: <FileSearchOutlined />, tooltip: 'Search' },
  ];

  const preprocessInput = async (text: string): Promise<string> => {
    let processedText = text;

    if (toolbarStatus.translate) {
      try {
        const response = await fetch('/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: processedText }),
        });
        if (response.ok) {
          const data = await response.json();
          processedText = data.translatedText;
        }
      } catch (error) {
        console.error('Translation failed:', error);
        appMessage.error('Translation failed');
      }
    }

    if (toolbarStatus.edit) {
      processedText = `Please help edit and improve this text: ${processedText}`;
    }

    if (toolbarStatus.search) {
      processedText = `Please help search for information about: ${processedText}`;
    }

    if (toolbarStatus.robot) {
      processedText = `As an AI assistant, please help with: ${processedText}`;
    }

    return processedText;
  };

  const getPlaceholder = () => {
    const activeFeatures = Object.entries(toolbarStatus)
      .filter(([_, value]) => value)
      .map(([key]) => {
        switch (key) {
          case 'robot': return 'AI Assistant';
          case 'translate': return 'Translation';
          case 'edit': return 'Editing';
          case 'search': return 'Search';
          default: return '';
        }
      });

    if (activeFeatures.length === 0) {
      return '← 点击展开文件上传区域';
    }

    return `Active features: ${activeFeatures.join(', ')}`;
  };

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
                <Space.Compact className="bubble-actions">
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
                  <Button
                    className="speak-button"
                    type="text"
                    size="small"
                    loading={playingMessageId === id}
                    icon={<SoundOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeak(message, id);
                    }}
                  />
                </Space.Compact>
              </div>
            ),
          }))}
        />
      </div>

      <Modal
        title="语音播放"
        open={showAudioModal}
        onCancel={() => {
          if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
          setShowAudioModal(false);
        }}
        footer={<></>}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          {audioUrl && (
            <>
              <audio
                ref={audioRef}
                controls
                style={{ width: '100%' }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
            </>
          )}
        </div>
      </Modal>

      <div className="chat-input">
        <div className="chat-input-wrapper">
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div className="icon-toolbar">
              {iconButtons.map(({ key, icon, tooltip }) => (
                <Button
                  key={key}
                  type="text"
                  icon={icon}
                  className={toolbarStatus[key] ? 'checked' : ''}
                  onClick={() => toggleIcon(key)}
                  title={tooltip}
                />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Dropdown overlay={settingsMenu} trigger={['click']}>
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  style={{ marginRight: 8 }}
                />
              </Dropdown>
              <Dropdown 
                overlay={voiceMenu} 
                trigger={['click']}
                dropdownRender={(menu) => (
                  <div style={{ 
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    background: '#fff'
                  }}>
                    {menu}
                  </div>
                )}
              >
                <Button
                  type="text"
                  icon={<AudioOutlined />}
                  style={{ marginRight: 8 }}
                />
              </Dropdown>
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
                placeholder={getPlaceholder()}
                onSubmit={async (msg) => {
                  const processedMsg = await preprocessInput(msg);
                  onRequest(processedMsg);
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
            </div>
          </div>
        </div>
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
    </div>
  );
};

export default Chat;
