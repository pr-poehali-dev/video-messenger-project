import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import Icon from '@/components/ui/icon';
import VideoPreview from '@/components/share/VideoPreview';
import MessengerButtons from '@/components/share/MessengerButtons';
import { useShareLogic } from '@/hooks/useShareLogic';

const Share: React.FC = () => {
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

  const {
    isSharing,
    shareToTelegram,
    shareToWhatsApp,
    shareToViber,
    shareUniversal,
    downloadVideo
  } = useShareLogic({ videoBlob });

  useEffect(() => {
    // Получаем видео из sessionStorage
    const savedVideoUrl = sessionStorage.getItem('recordedVideo');
    if (savedVideoUrl) {
      setVideoUrl(savedVideoUrl);
      // Конвертируем URL в Blob для отправки
      fetch(savedVideoUrl)
        .then(response => response.blob())
        .then(blob => setVideoBlob(blob))
        .catch(error => {
          console.error('Ошибка загрузки видео:', error);
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить видео",
            variant: "destructive"
          });
        });
    } else {
      // Если видео нет, возвращаемся на страницу записи
      navigate('/record');
    }
  }, [navigate]);

  const handleDownloadWithToast = () => {
    if (downloadVideo()) {
      toast({
        title: "✅ Видео скачано",
        description: "Файл сохранен в папку загрузок",
      });
    }
  };

  if (!videoUrl) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Загрузка видео...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white">
      {/* Шапка */}
      <div className="relative z-20 p-4 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/record')}
            className="text-white hover:bg-white/10"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>
          
          <h1 className="text-lg font-bold">Отправить видео</h1>
          
          <div className="w-20" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Превью видео */}
        <VideoPreview 
          videoUrl={videoUrl} 
          onDownload={handleDownloadWithToast}
        />

        {/* Кнопки мессенджеров */}
        <MessengerButtons
          onTelegramShare={shareToTelegram}
          onWhatsAppShare={shareToWhatsApp}
          onViberShare={shareToViber}
          onUniversalShare={shareUniversal}
          isSharing={isSharing}
          hasUniversalShare={!!(navigator.share && videoBlob)}
        />

      </div>
    </div>
  );
};

export default Share;