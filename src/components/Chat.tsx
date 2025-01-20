import React, { useState, useRef } from 'react';
import { Button, Input, Upload, message, Card, List, Space } from 'antd';
import { SendOutlined, AudioOutlined, UploadOutlined } from '@ant-design/icons';
import { generateResponse, ChatMessage } from '../api/ollama';

const { TextArea } = Input;

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const newMessages = [
      ...messages,
      { role: 'user', content: inputText } as ChatMessage
    ];
    setMessages(newMessages);
    setInputText('');

    try {
      const response = await generateResponse(newMessages);
      setMessages([...newMessages, response]);
    } catch (error) {
      message.error('Failed to get response from AI');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob);

        try {
          // Here we'll need to call whisper.cpp endpoint
          const response = await fetch('http://localhost:8080/transcribe', {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();
          setInputText(data.text);
        } catch (error) {
          message.error('Failed to transcribe audio');
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      message.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <Card style={{ maxWidth: 800, margin: '0 auto', marginTop: 20 }}>
      <List
        dataSource={messages}
        renderItem={(msg) => (
          <List.Item style={{ 
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' 
          }}>
            <Card 
              style={{ 
                maxWidth: '70%',
                backgroundColor: msg.role === 'user' ? '#e6f7ff' : '#f0f2f5'
              }}
            >
              {msg.content}
            </Card>
          </List.Item>
        )}
        style={{ height: 400, overflow: 'auto', marginBottom: 20 }}
      />
      
      <Space.Compact style={{ width: '100%' }}>
        <TextArea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          icon={<AudioOutlined />}
          onClick={isRecording ? stopRecording : startRecording}
          danger={isRecording}
        />
        <Upload
          beforeUpload={(file) => {
            // Handle file upload here
            return false;
          }}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />} />
        </Upload>
        <Button 
          type="primary" 
          icon={<SendOutlined />} 
          onClick={handleSend}
        />
      </Space.Compact>
    </Card>
  );
};

export default Chat;
