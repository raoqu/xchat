import { CloudUploadOutlined, CopyOutlined, EnterOutlined, LinkOutlined, LoadingOutlined, MenuOutlined, SettingOutlined, SoundOutlined, UserOutlined, VerticalAlignBottomOutlined } from '@ant-design/icons';
import { Attachments, Bubble, AttachmentsProps, Sender, useXChat, useXAgent, XRequest } from '@ant-design/x';
import { App, Button, Dropdown, Flex, Menu, Modal, Space, Spin, Switch, Typography, type GetProp, type GetRef } from 'antd';
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
  const VOICE_OPTIONS = {
    '1aacaeb1b840436391b835fd5513f4c4': '默认（芙宁娜）',
    '2d01a8fde0334a64bd64f28bd3658043': '电台情感（女）',
    'cb73f2bb9bf447f492f118bf362c10b4': '治愈放松女声',
    '4ddfa1f451f04d85b809dcad9d76e91f': '舒服的男声',
    '59cb5986671546eaa6ca8ae6f29f6d22': '央视配音（男）',
    '6758b6fa79384cffae6f4adea4b5cc65': '短剧解说',
    '明星': '---',
    'cb03a4a3ff6a4784b319cde85a07e31c': '刘德华',
    'a8145bae97fe46b483ac228e47f57c51': '刘德华（沙哑）',
    '6df306900c4547158edfdd824240ea78': '彭于晏',
    '8dec7aaf4edc4d55a60132179a36b0df': '赵本山',
    '188c9b7c06654042be0e8a25781761e8': '周杰伦',
    '9a32f25d901e48e0885dbda99b08593a': '撒贝宁',
    '54a5170264694bfc8e9ad98df7bd89c3': '丁真',
    '3b55b3d84d2f453a98d8ca9bb24182d6': '邓紫琪',
    '9cb8c56838094a7ab0fcd2ec355316b9': '刘亦菲',
    '动漫': '---',
    '131c6b3a889543139680d8b3aa26b98d': '懒羊羊',
    '0b8449eb752c4f888f463fc5d2c0db65': '可莉',
    '626bb6d3f3364c9cbc3aa6a67300a664': '可莉(2)',
    '29a7fd66aba84ea9a00f7f6e25e74238': '初学道悟空',
    '3d1cb00d75184099992ddbaf0fdd7387': '奶龙',
    'a89a387d743f46f99a6935655673a050': '海绵宝宝',
    '影视角色': '---',
    '4729cb883a58431996b998f2fca7f38b': '祁同伟',
    '2d4fe930c97146c98ae2785c2845341a': '关羽',
    'a8c09950c8664e13a7d11b54e37a8e29': '曹操-激动',
    '其他': '---',
    'aebaa2305aa2452fbdc8f41eec852a79': '雷军',
    '8be867e6c76842758ce6f1625d60bb77': '雷军（演讲）',
    '诱惑风': '---',
    '6ce7ea8ada884bf3889fa7c7fb206691': '茉莉（御女）',
    'a2569c4274ac40a4824ce1919f4de093': '夹子音',
    'e9198dfc754b4d83b501612c4c95c615': '女王陛下',
  } as const;

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
  const [selectedVoice, setSelectedVoice] = React.useState<keyof typeof VOICE_OPTIONS>('1aacaeb1b840436391b835fd5513f4c4');
  const [selectedModel, setSelectedModel] = React.useState<keyof typeof MODEL_OPTIONS>('qwen');

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
      const playUrl =`/play?url=${encodeURIComponent(url)}`
      
      if (audioRef.current) {
        audioRef.current.src = playUrl;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch(error => {
              console.error('Audio playback failed:', error);
              appMessage.error('Failed to play audio');
            });
        }
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
      appMessage.error('Failed to play audio');
    }
  };

  const handleSpeak = async (text: string, messageId: string) => {
    let modalInstance: ReturnType<typeof modal.info> | null = null;
    try {
      setPlayingMessageId(messageId);
      
      // Show loading modal
      modalInstance = modal.info({
        title: '正在转换语音',
        content: (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            <p style={{ marginTop: 16 }}>请稍候...</p>
          </div>
        ),
        icon: null,
        maskClosable: false,
        closable: false,
        footer: null,
      });

      const response = await fetch('/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: selectedVoice,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to speak');
      }

      const data = await response.json();
      setAudioUrl(data.url);
      
      // Close loading modal
      modalInstance?.destroy();

      // Show audio player modal and start playing
      setShowAudioModal(true);
      await playAudio(data.url);
      
    } catch (error) {
      modalInstance?.destroy();
      appMessage.error('语音转换失败');
    } finally {
      setPlayingMessageId(null);
    }
  };

  const settingsMenu = (
    <Menu
      items={[
        {
          key: 'voice',
          label: '语音设置',
          children: createMenuItems(
            VOICE_OPTIONS,
            selectedVoice,
            setSelectedVoice
          ),
          popupClassName: 'scrollable-submenu',
        },
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
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Dropdown 
              overlay={settingsMenu} 
              trigger={['click']}
              placement="topLeft"
            >
              <Button
                type="text"
                icon={<SettingOutlined />}
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
