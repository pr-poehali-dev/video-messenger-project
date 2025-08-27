import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface VideoPreviewProps {
  videoUrl: string;
  onDownload: () => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ videoUrl, onDownload }) => {
  return (
    <Card className="p-4 bg-black/30 border-gray-800">
      <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
        <video
          src={videoUrl}
          controls
          className="w-full h-full object-cover"
          playsInline
        />
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>Видео готово к отправке</span>
        <Button
          onClick={onDownload}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
        >
          <Icon name="Download" size={16} className="mr-2" />
          Скачать
        </Button>
      </div>
    </Card>
  );
};

export default VideoPreview;