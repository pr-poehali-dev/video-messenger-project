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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
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

  const shareToTelegram = () => {
    const text = "Поделиться видео через Telegram";
    const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    
    toast({
      title: "Открыт Telegram",
      description: "Можете поделиться ссылкой"
    });
  };

  const shareToWhatsApp = () => {
    const text = "Смотри видео, которое я записал!";
    const url = `https://wa.me/?text=${encodeURIComponent(text + " " + window.location.href)}`;
    window.open(url, '_blank');
    
    toast({
      title: "Открыт WhatsApp",
      description: "Можете поделиться ссылкой"
    });
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
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    onClick={shareToTelegram}
                    variant="outline"
                    className="flex items-center justify-center gap-2 p-3"
                  >
                    <Icon name="Send" size={16} />
                    Telegram
                  </Button>
                  
                  <Button
                    onClick={shareToWhatsApp}
                    variant="outline"
                    className="flex items-center justify-center gap-2 p-3"
                  >
                    <Icon name="MessageCircle" size={16} />
                    WhatsApp
                  </Button>
                  
                  <Button
                    onClick={downloadVideo}
                    variant="outline"
                    className="flex items-center justify-center gap-2 p-3"
                  >
                    <Icon name="Download" size={16} />
                    Сохранить
                  </Button>
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