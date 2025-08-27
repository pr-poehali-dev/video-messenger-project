import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

interface ShareLogicParams {
  videoBlob: Blob | null;
}

export const useShareLogic = ({ videoBlob }: ShareLogicParams) => {
  const navigate = useNavigate();
  const [isSharing, setIsSharing] = useState(false);

  const prepareVideoMessage = () => {
    const locationData = localStorage.getItem('userLocation');
    let locationText = '';
    
    if (locationData) {
      try {
        const location = JSON.parse(locationData);
        const lat = parseFloat(location.latitude).toFixed(6);
        const lng = parseFloat(location.longitude).toFixed(6);
        const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
        locationText = `\n📍 Координаты: ${lat}, ${lng}\n🗺️ Карта: ${mapsUrl}`;
      } catch (e) {
        console.error('Ошибка геолокации:', e);
      }
    }

    return `🎥 Новый лид IMPERIA PROMO!\n📅 ${new Date().toLocaleString('ru-RU')}${locationText}`;
  };

  const downloadVideo = () => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imperia_lead_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.mp4`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    }
    return false;
  };

  const shareToTelegram = async () => {
    setIsSharing(true);
    
    try {
      if (!videoBlob) {
        throw new Error('Видеофайл не найден');
      }

      const message = prepareVideoMessage();
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isMobile = isAndroid || isIOS;
      
      // Создаем файл для отправки
      const videoFile = new File([videoBlob], `imperia_lead_${Date.now()}.mp4`, {
        type: videoBlob.type || 'video/mp4'
      });
      
      // Приоритет 1: Web Share API (работает на современных мобильных браузерах)
      if (navigator.share && navigator.canShare) {
        try {
          const canShareFiles = navigator.canShare({ files: [videoFile] });
          
          if (canShareFiles) {
            await navigator.share({
              title: '🎥 Новый лид IMPERIA PROMO',
              text: message,
              files: [videoFile]
            });
            
            toast({
              title: "✅ Видео отправлено",
              description: "Видео успешно передано в выбранное приложение",
            });
            
            setTimeout(() => navigate('/success'), 1000);
            return;
          } else {
            // Если нельзя поделиться файлами, просто поделимся текстом
            await navigator.share({
              title: '🎥 Новый лид IMPERIA PROMO',
              text: message
            });
            
            // Показываем инструкцию по скачиванию
            toast({
              title: "📩 Скачайте видео",
              description: "Нажмите 'Скачать' для сохранения видео, затем прикрепите его к сообщению",
            });
            
            // Автоматическое скачивание
            setTimeout(() => {
              downloadVideo();
            }, 1000);
            
            return;
          }
          
        } catch (shareError: any) {
          console.log('Web Share API ошибка:', shareError);
          if (shareError.name === 'AbortError') {
            return; // Пользователь отменил
          }
        }
      }
      
      // Приоритет 2: Автоматическое скачивание + открытие мессенджера
      const encodedMessage = encodeURIComponent(message);
      
      // Скачиваем видео
      downloadVideo();
      
      // Открываем Telegram через короткую задержку
      setTimeout(() => {
        if (isMobile) {
          // Мобильные: нативное приложение
          window.location.href = `tg://msg?text=${encodedMessage}`;
          
          // Fallback на веб-версию
          setTimeout(() => {
            window.open(`https://t.me/share/url?url=${encodedMessage}`, '_blank');
          }, 1500);
        } else {
          // Desktop: Telegram Web
          window.open(`https://web.telegram.org/a/#?text=${encodedMessage}`, '_blank');
        }
      }, 2000);
      
      toast({
        title: "📥 Видео скачано!",
        description: isMobile 
          ? "Прикрепите скаченный файл в Telegram"
          : "Перетащите скаченный файл в окно Telegram",
      });
      
      setTimeout(() => navigate('/success'), 4000);
      
    } catch (error: any) {
      console.error('Ошибка отправки:', error);
      
      // В качестве окончательного fallback скачиваем видео
      try {
        downloadVideo();
        toast({
          title: "📥 Видео скачано",
          description: "Откройте Telegram и прикрепите скаченный файл",
        });
      } catch (downloadError) {
        toast({
          title: "Ошибка",
          description: "Не удалось отправить или скачать видео",
          variant: "destructive"
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  const shareToWhatsApp = async () => {
    setIsSharing(true);
    
    try {
      if (!videoBlob) {
        throw new Error('Видеофайл не найден');
      }

      const message = prepareVideoMessage();
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isMobile = isAndroid || isIOS;
      
      // Создаем файл для отправки
      const videoFile = new File([videoBlob], `imperia_lead_${Date.now()}.mp4`, {
        type: videoBlob.type || 'video/mp4'
      });
      
      // Приоритет 1: Web Share API
      if (navigator.share && navigator.canShare) {
        try {
          const canShareFiles = navigator.canShare({ files: [videoFile] });
          
          if (canShareFiles) {
            await navigator.share({
              title: '🎥 Новый лид IMPERIA PROMO',
              text: message,
              files: [videoFile]
            });
            
            toast({
              title: "✅ Видео отправлено",
              description: "Видео успешно передано в WhatsApp",
            });
            
            setTimeout(() => navigate('/success'), 1000);
            return;
          }
          
        } catch (shareError: any) {
          console.log('Web Share API ошибка:', shareError);
          if (shareError.name === 'AbortError') {
            return;
          }
        }
      }
      
      // Приоритет 2: Скачивание + открытие WhatsApp
      downloadVideo();
      
      const encodedMessage = encodeURIComponent(message);
      
      setTimeout(() => {
        if (isMobile) {
          // Мобильные: нативное приложение
          window.location.href = `whatsapp://send?text=${encodedMessage}`;
          
          setTimeout(() => {
            window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
          }, 1500);
        } else {
          // Desktop: WhatsApp Web
          window.open(`https://web.whatsapp.com/send?text=${encodedMessage}`, '_blank');
        }
      }, 2000);
      
      toast({
        title: "📥 Видео скачано!",
        description: isMobile 
          ? "Прикрепите скаченный файл в WhatsApp"
          : "Перетащите скаченный файл в WhatsApp Web",
      });
      
      setTimeout(() => navigate('/success'), 4000);
      
    } catch (error: any) {
      console.error('Ошибка отправки WhatsApp:', error);
      
      try {
        downloadVideo();
        toast({
          title: "📥 Видео скачано",
          description: "Откройте WhatsApp и прикрепите скаченный файл",
        });
      } catch (downloadError) {
        toast({
          title: "Ошибка",
          description: "Не удалось отправить в WhatsApp",
          variant: "destructive"
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  const shareToViber = async () => {
    setIsSharing(true);
    
    try {
      if (!videoBlob) {
        throw new Error('Видеофайл не найден');
      }

      const message = prepareVideoMessage();
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isMobile = isAndroid || isIOS;
      
      if (!isMobile) {
        toast({
          title: "💜 Viber",
          description: "Viber работает только на мобильных устройствах",
          variant: "destructive"
        });
        return;
      }
      
      // Создаем файл для отправки
      const videoFile = new File([videoBlob], `imperia_lead_${Date.now()}.mp4`, {
        type: videoBlob.type || 'video/mp4'
      });
      
      // Приоритет 1: Web Share API
      if (navigator.share && navigator.canShare) {
        try {
          const canShareFiles = navigator.canShare({ files: [videoFile] });
          
          if (canShareFiles) {
            await navigator.share({
              title: '🎥 Новый лид IMPERIA PROMO',
              text: message,
              files: [videoFile]
            });
            
            toast({
              title: "✅ Видео отправлено",
              description: "Видео успешно передано в Viber",
            });
            
            setTimeout(() => navigate('/success'), 1000);
            return;
          }
          
        } catch (shareError: any) {
          if (shareError.name === 'AbortError') {
            return;
          }
        }
      }
      
      // Приоритет 2: Скачивание + открытие Viber
      downloadVideo();
      
      const encodedMessage = encodeURIComponent(message);
      
      setTimeout(() => {
        // Viber deep link
        window.location.href = `viber://forward?text=${encodedMessage}`;
      }, 2000);
      
      toast({
        title: "📥 Видео скачано!",
        description: "Прикрепите скаченный файл в Viber",
      });
      
      setTimeout(() => navigate('/success'), 4000);
      
    } catch (error: any) {
      console.error('Ошибка отправки Viber:', error);
      
      try {
        downloadVideo();
        toast({
          title: "📥 Видео скачано",
          description: "Откройте Viber и прикрепите скаченный файл",
        });
      } catch (downloadError) {
        toast({
          title: "Ошибка",
          description: "Не удалось отправить в Viber",
          variant: "destructive"
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  const shareUniversal = async () => {
    if (!videoBlob) return;
    
    try {
      const videoFile = new File([videoBlob], 'imperia_video.mp4', {
        type: videoBlob.type || 'video/mp4'
      });
      
      await navigator.share({
        title: '🎥 Видео IMPERIA PROMO',
        text: prepareVideoMessage(),
        files: [videoFile]
      });
    } catch (error) {
      console.log('Отправка отменена:', error);
    }
  };

  return {
    isSharing,
    shareToTelegram,
    shareToWhatsApp,
    shareToViber,
    shareUniversal,
    downloadVideo
  };
};