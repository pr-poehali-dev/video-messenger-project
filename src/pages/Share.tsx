import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import Icon from '@/components/ui/icon';

const Share: React.FC = () => {
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isSharing, setIsSharing] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

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

  const prepareVideoMessage = () => {
    // Подготавливаем сообщение с геолокацией
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
          }
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
          ? "Прикрепите скачанный файл в Telegram"
          : "Перетащите скачанный файл в окно Telegram",
      });
      
      setTimeout(() => navigate('/success'), 4000);
      
      
    } catch (error: any) {
      console.error('Ошибка отправки:', error);
      
      // В качестве окончательного fallback скачиваем видео
      try {
        downloadVideo();
        toast({
          title: "📥 Видео скачано",
          description: "Откройте Telegram и прикрепите скачанный файл",
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
          ? "Прикрепите скачанный файл в WhatsApp"
          : "Перетащите скачанный файл в WhatsApp Web",
      });
      
      setTimeout(() => navigate('/success'), 4000);
      
    } catch (error: any) {
      console.error('Ошибка отправки WhatsApp:', error);
      
      try {
        downloadVideo();
        toast({
          title: "📥 Видео скачано",
          description: "Откройте WhatsApp и прикрепите скачанный файл",
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
        description: "Прикрепите скачанный файл в Viber",
      });
      
      setTimeout(() => navigate('/success'), 4000);
      
    } catch (error: any) {
      console.error('Ошибка отправки Viber:', error);
      
      try {
        downloadVideo();
        toast({
          title: "📥 Видео скачано",
          description: "Откройте Viber и прикрепите скачанный файл",
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
              onClick={downloadVideo}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Icon name="Download" size={16} className="mr-2" />
              Скачать
            </Button>
          </div>
        </Card>

        {/* Мессенджеры */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-center mb-6">Выберите мессенджер</h2>
          
          {/* Telegram */}
          <Button
            onClick={shareToTelegram}
            disabled={isSharing}
            className="w-full h-16 bg-[#0088CC] hover:bg-[#0077B5] text-white text-lg font-semibold rounded-xl flex items-center justify-center gap-4 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <Icon name="Send" size={20} className="text-[#0088CC]" />
            </div>
            {isSharing ? 'Отправка...' : 'Telegram'}
          </Button>

          {/* WhatsApp */}
          <Button
            onClick={shareToWhatsApp}
            disabled={isSharing}
            className="w-full h-16 bg-[#25D366] hover:bg-[#20BA5A] text-white text-lg font-semibold rounded-xl flex items-center justify-center gap-4 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <Icon name="MessageCircle" size={20} className="text-[#25D366]" />
            </div>
            {isSharing ? 'Отправка...' : 'WhatsApp'}
          </Button>

          {/* Viber */}
          <Button
            onClick={shareToViber}
            disabled={isSharing}
            className="w-full h-16 bg-[#665CAC] hover:bg-[#5A5099] text-white text-lg font-semibold rounded-xl flex items-center justify-center gap-4 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <Icon name="Phone" size={20} className="text-[#665CAC]" />
            </div>
            {isSharing ? 'Отправка...' : 'Viber'}
          </Button>

          {/* Универсальная отправка (Web Share API) */}
          {navigator.share && (
            <Button
              onClick={async () => {
                try {
                  if (videoBlob) {
                    const videoFile = new File([videoBlob], 'imperia_video.mp4', {
                      type: videoBlob.type || 'video/mp4'
                    });
                    
                    await navigator.share({
                      title: '🎥 Видео IMPERIA PROMO',
                      text: prepareVideoMessage(),
                      files: [videoFile]
                    });
                  }
                } catch (error) {
                  console.log('Отправка отменена:', error);
                }
              }}
              variant="outline"
              className="w-full h-16 border-gray-600 text-white hover:bg-gray-800 text-lg font-semibold rounded-xl flex items-center justify-center gap-4"
            >
              <Icon name="Share" size={24} />
              Другие приложения
            </Button>
          )}
        </div>

        {/* Информация */}
        <Card className="p-4 bg-blue-900/20 border-blue-500/50">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={20} className="text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-200">
              <p className="font-semibold mb-2">Как отправить видео:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-100">
                <li>Выберите мессенджер выше</li>
                <li>Выберите получателя в приложении</li>
                <li>Прикрепите видео к сообщению</li>
                <li>Отправьте сообщение</li>
              </ol>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default Share;