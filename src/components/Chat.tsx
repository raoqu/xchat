import { CloudUploadOutlined, EnterOutlined, LinkOutlined } from '@ant-design/icons';
import { Attachments, AttachmentsProps, Sender } from '@ant-design/x';
import { App, Button, Flex, Space, Switch, Typography, type GetProp, type GetRef } from 'antd';
import React from 'react';

const Chat: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<GetProp<AttachmentsProps, 'items'>>([]);
  const [text, setText] = React.useState('');
  const [hasRef, setHasRef] = React.useState(true);

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
    <Sender.Header
      title="Attachments"
      styles={{
        content: {
          padding: 0,
        },
      }}
      open={open}
      onOpenChange={setOpen}
      forceRender
    >
      <Attachments
        ref={attachmentsRef}
        // Mock not real upload file
        beforeUpload={() => false}
        items={items}
        onChange={({ fileList }) => setItems(fileList)}
        placeholder={(type) =>
          type === 'drop'
            ? {
                title: 'Drop file here',
              }
            : {
                icon: <CloudUploadOutlined />,
                title: 'Upload files',
                description: 'Click or drag files to this area to upload',
              }
        }
        getDropContainer={() => senderRef.current?.nativeElement}
      />
    </Sender.Header>
  );

  return (
    <div style={{ height: '100%', maxWidth: 1200, margin: '0 auto' }}>
    <Flex vertical gap="middle" align="flex-start" style={{ height: 220, margin: '0 auto' }}>
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
        placeholder="← Click to open"
        onSubmit={() => {
          setItems([]);
          setText('');
        }}
      />
    </Flex>
    </div>
  );
};

export default Chat;
