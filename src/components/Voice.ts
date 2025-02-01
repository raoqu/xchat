import { Modal, message } from 'antd';
import React from 'react';
import { LoadingModalContent } from './VoiceModal';

export const VOICE_OPTIONS = {
  '1aacaeb1b840436391b835fd5513f4c4': '默认（芙宁娜）',
  '2d01a8fde0334a64bd64f28bd3658043': '电台情感（女）',
  'cb73f2bb9bf447f492f118bf362c10b4': '治愈放松女声',
  '4ddfa1f451f04d85b809dcad9d76e91f': '舒服的男声',
  '59cb5986671546eaa6ca8ae6f29f6d22': '央视配音（男）',
  '6758b6fa79384cffae6f4adea4b5cc65': '短剧解说',
  '明星': '---',
  'cb03a4a3ff6a4784b319cde85a07e31c': '刘德华',
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
  '8be867e6c76842758ce6f1625d60bb77': '雷军（演讲）',
  '诱惑风': '---',
  '6ce7ea8ada884bf3889fa7c7fb206691': '茉莉（御女）',
  'a2569c4274ac40a4824ce1919f4de093': '夹子音',
  'e9198dfc754b4d83b501612c4c95c615': '女王陛下',
} as const;

export type VoiceOption = keyof typeof VOICE_OPTIONS;

export class VoicePlayer {
  private audioRef: React.RefObject<HTMLAudioElement>;
  private appMessage: typeof message;

  constructor(audioRef: React.RefObject<HTMLAudioElement>, appMessage: typeof message) {
    this.audioRef = audioRef;
    this.appMessage = appMessage;
  }

  async playAudio(url: string): Promise<void> {
    try {
      const playUrl = `/play?url=${encodeURIComponent(url)}`;
      
      if (this.audioRef.current) {
        this.audioRef.current.src = playUrl;
        const playPromise = this.audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          return Promise.resolve();
        }
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
      this.appMessage.error('Failed to play audio');
      return Promise.reject(error);
    }
  }

  async handleSpeak(text: string, selectedVoice: VoiceOption): Promise<string> {
    let modalInstance: ReturnType<typeof Modal.info> | null = null;
    try {
      // Show loading modal
      modalInstance = Modal.info({
        title: '正在转换语音',
        content: React.createElement(LoadingModalContent),
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
      return data.url;
    } catch (error) {
      this.appMessage.error('语音转换失败');
      throw error;
    } finally {
      modalInstance?.destroy();
    }
  }
}
