import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startCamera = async (facing = facingMode) => {
    try {
      // Останавливаем текущий поток если есть
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 1280, 
          height: 720,
          facingMode: facing
        },
        audio: true
      });
      
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      toast({
        title: "Камера подключена",
        description: "Готов к записи видео"
      });
    } catch (error) {
      console.error('Ошибка доступа к камере:', error);
      toast({
        title: "Ошибка доступа к камере",
        description: "Проверьте разрешения браузера",
        variant: "destructive"
      });
    }
  };

  const startRecording = useCallback(() => {
    if (!mediaStream) {
      startCamera();
      return;
    }

    const mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks(prev => [...prev, event.data]);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
      setRecordedBlob(blob);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setRecordedChunks([]);
    
    toast({
      title: "Запись началась",
      description: "Видео записывается..."
    });
  }, [mediaStream, recordedChunks]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Запись завершена",
        description: "Видео готово для отправки"
      });
    }
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadVideo = () => {
    if (recordedVideoUrl) {
      const a = document.createElement('a');
      a.href = recordedVideoUrl;
      a.download = `recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Видео сохранено",
        description: "Файл загружен на устройство"
      });
    }
  };

  const toggleCamera = async () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    await startCamera(newFacing);
    
    toast({
      title: "Камера переключена",
      description: newFacing === 'environment' ? "Задняя камера" : "Передняя камера"
    });
  };

  const shareToTelegram = async () => {
    if (!recordedBlob) {
      toast({
        title: "Ошибка",
        description: "Нет записанного видео для отправки",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const file = new File([recordedBlob], `video_${Date.now()}.mp4`, { type: recordedBlob.type });
      
      // Геолокация для сообщения
      const locationData = localStorage.getItem('userLocation');
      let locationText = '';
      if (locationData) {
        try {
          const location = JSON.parse(locationData);
          const lat = parseFloat(location.latitude).toFixed(6);
          const lng = parseFloat(location.longitude).toFixed(6);
          const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
          locationText = `\n📍 ${lat}, ${lng}\n🗺️ ${mapsUrl}`;
        } catch (e) {
          console.error('Ошибка геолокации:', e);
        }
      }
      
      const message = `🎥 Новый лид IMPERIA PROMO!\n📅 ${new Date().toLocaleString()}${locationText}`;
      
      // Попробуем Web Share API для прямой отправки
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: '🎥 Новый лид IMPERIA PROMO',
            text: message,
            files: [file]
          });
          
          // Переход на страницу успеха
          setTimeout(() => {
            window.location.href = '/success';
          }, 500);
          return;
          
        } catch (shareError) {
          console.log('Web Share отменен или не удался:', shareError.name);
          if (shareError.name === 'AbortError') {
            return; // Пользователь отменил
          }
        }
      }
      
      // Fallback: открытие Telegram с текстом + инструкции
      const encodedMessage = encodeURIComponent(message);
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Мобильные: открываем Telegram
        window.location.href = `tg://msg?text=${encodedMessage}`;
        
        // Fallback через веб
        setTimeout(() => {
          window.open(`https://t.me/share/url?url=${encodedMessage}`, '_blank');
        }, 1000);
        
        alert('📱 Откроется Telegram\n\n1. Выберите получателя\n2. Нажмите кнопку прикрепления (📎)\n3. Выберите видео из галереи\n4. Отправьте сообщение');
      } else {
        // Desktop: Telegram Web
        window.open(`https://web.telegram.org/a/#?text=${encodedMessage}`, '_blank');
        alert('💻 Откроется Telegram Web\n\n1. Выберите чат\n2. Перетащите видеофайл в окно чата\n3. Добавьте сообщение как подпись');
      }
      
      setTimeout(() => {
        window.location.href = '/success';
      }, 2000);
      
    } catch (error) {
      console.error('Ошибка отправки:', error);
      toast({
        title: "Ошибка",
        description: "Ошибка при отправке видео. Попробуйте ещё раз",
        variant: "destructive"
      });
    }
  };

  const shareToWhatsApp = async () => {
    if (!recordedBlob) {
      toast({
        title: "Ошибка",
        description: "Нет записанного видео для отправки",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Начинаю отправку в WhatsApp. Размер файла:', recordedBlob.size);
    
    // Принудительно скачиваем файл и открываем WhatsApp
    try {
      const url = URL.createObjectURL(recordedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `whatsapp-video-${Date.now()}.webm`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Очищаем URL через некоторое время
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      
      // Открываем WhatsApp через небольшую задержку
      setTimeout(() => {
        const text = "Смотри видео, которое я записал! 📹\\n\\nФайл скачан на устройство - прикрепи его к сообщению";
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
      }, 800);
      
      toast({
        title: "✅ Готово!",
        description: "Видео скачано. WhatsApp открыт - прикрепите файл к сообщению"
      });
      
    } catch (error) {
      console.error('Критическая ошибка отправки:', error);
      
      toast({
        title: "Критическая ошибка",
        description: "Не удалось подготовить файл для отправки",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    startCamera();
    
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background font-inter">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          
          {/* QR Code Block */}
          <Card className="p-8 flex flex-col items-center justify-center bg-card border-0 shadow-lg">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">QR-код для быстрого доступа</h2>
              <p className="text-muted-foreground">Отсканируйте для открытия на мобильном устройстве</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border">
              <img 
                src="https://cdn.poehali.dev/files/159e26ec-4b1f-45a8-ad67-c54482cb585f.jpeg" 
                alt="QR Code"
                className="w-64 h-64 object-contain"
              />
            </div>
            
            <div className="mt-8 flex gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Icon name="Copy" size={16} />
                Копировать ссылку
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Icon name="Share2" size={16} />
                Поделиться
              </Button>
            </div>
          </Card>

          {/* Video Recorder Block */}
          <Card className="p-8 bg-card border-0 shadow-lg">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2 text-foreground">Видеорекордер</h2>
              <p className="text-muted-foreground">Записывайте видео и делитесь в мессенджерах</p>
            </div>

            {/* Video Preview */}
            <div className="relative mb-6 bg-gray-900 rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-64 object-cover"
              />
              
              {isRecording && (
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    REC {formatTime(recordingTime)}
                  </div>
                </div>
              )}
              
              {!mediaStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
                  <div className="text-center">
                    <Icon name="Camera" size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Камера не подключена</p>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex justify-center gap-3 mb-4">
              <Button
                onClick={toggleCamera}
                variant="outline"
                size="sm"
                disabled={!mediaStream || isRecording}
                className="flex items-center gap-2"
              >
                <Icon name={facingMode === 'environment' ? 'Camera' : 'User'} size={16} />
                {facingMode === 'environment' ? 'Задняя' : 'Передняя'}
              </Button>
            </div>

            {/* Recording Controls */}
            <div className="flex justify-center mb-6">
              {!isRecording ? (
                <Button 
                  onClick={startRecording}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                  disabled={!mediaStream}
                >
                  <Icon name="Video" size={20} className="mr-2" />
                  Начать запись
                </Button>
              ) : (
                <Button 
                  onClick={stopRecording}
                  variant="destructive"
                  size="lg"
                  className="px-8"
                >
                  <Icon name="Square" size={20} className="mr-2" />
                  Остановить запись
                </Button>
              )}
            </div>

            {/* Recorded Video Preview */}
            {recordedVideoUrl && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Записанное видео</h3>
                <video
                  src={recordedVideoUrl}
                  controls
                  className="w-full h-32 bg-gray-900 rounded-lg"
                />
              </div>
            )}

            {/* Share & Download Options */}
            {recordedVideoUrl && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-center">Поделиться видео</h3>
                
                <div className="space-y-3">
                  <Button
                    onClick={shareToTelegram}
                    className="w-full bg-[#0088CC] hover:bg-[#0077B5] text-white flex items-center justify-center gap-2 p-3"
                  >
                    <Icon name="Send" size={16} />
                    Отправить в Telegram
                  </Button>
                  
                  <Button
                    onClick={shareToWhatsApp}
                    className="w-full bg-[#25D366] hover:bg-[#20C05C] text-white flex items-center justify-center gap-2 p-3"
                  >
                    <Icon name="MessageCircle" size={16} />
                    Отправить в WhatsApp
                  </Button>
                  
                  <Button
                    onClick={downloadVideo}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 p-3"
                  >
                    <Icon name="Download" size={16} />
                    Скачать на устройство
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground mt-4 p-3 bg-muted/20 rounded-lg">
                  <Icon name="Info" size={16} className="inline mr-2" />
                  Файл автоматически скачается на устройство, затем откроется мессенджер для отправки
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;