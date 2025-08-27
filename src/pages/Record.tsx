import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import Icon from '@/components/ui/icon';

const Record: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string>('');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [cameraError, setCameraError] = useState<string>('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startCamera = async () => {
    try {
      setIsInitializing(true);
      setCameraError('');

      // Проверяем поддержку медиа API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Ваш браузер не поддерживает доступ к камере');
      }

      // Определяем мобильное устройство
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      // Расширенные настройки для мобильных устройств
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Тыловая камера
          width: { ideal: isMobile ? 1280 : 1920 },
          height: { ideal: isMobile ? 720 : 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 2
        }
      };

      // Получаем доступ к камере и микрофону
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Для iOS добавляем дополнительные атрибуты
        if (isIOS) {
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('webkit-playsinline', 'true');
        }
        await videoRef.current.play();
      }
      
      setMediaStream(stream);
      
      toast({
        title: "✅ Камера готова",
        description: `Тыловая камера подключена. Качество: ${stream.getVideoTracks()[0]?.getSettings()?.width || 'авто'}p`,
      });

    } catch (error: any) {
      console.error('Ошибка доступа к камере:', error);
      let errorMessage = 'Не удалось получить доступ к камере';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Доступ к камере запрещен. Разрешите в настройках браузера';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Камера не найдена на устройстве';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Камера используется другим приложением';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Настройки камеры не поддерживаются устройством';
      }
      
      setCameraError(errorMessage);
      toast({
        title: "❌ Ошибка камеры",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const startRecording = () => {
    if (!mediaStream) {
      toast({
        title: "Ошибка",
        description: "Камера не подключена",
        variant: "destructive"
      });
      return;
    }

    try {
      chunksRef.current = [];
      
      // Настройки записи для высокого качества
      const options: MediaRecorderOptions = {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : MediaRecorder.isTypeSupported('video/mp4')
          ? 'video/mp4'
          : 'video/webm',
        videoBitsPerSecond: 2500000, // 2.5 Mbps для хорошего качества
        audioBitsPerSecond: 128000   // 128 kbps для аудио
      };

      const mediaRecorder = new MediaRecorder(mediaStream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: options.mimeType || 'video/webm' 
        });
        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideoUrl(videoUrl);
        
        toast({
          title: "✅ Видео записано",
          description: `Длительность: ${formatTime(recordingTime)}. Размер: ${(blob.size / 1024 / 1024).toFixed(1)} МБ`,
        });
      };

      mediaRecorder.start(1000); // Собираем данные каждую секунду
      setIsRecording(true);
      setRecordingTime(0);
      
      toast({
        title: "🎥 Запись началась",
        description: "Записывается видео с тыловой камеры",
      });

    } catch (error) {
      console.error('Ошибка записи:', error);
      toast({
        title: "Ошибка записи",
        description: "Не удалось начать запись видео",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleNext = () => {
    if (recordedVideoUrl) {
      // Сохраняем URL видео для следующей страницы
      sessionStorage.setItem('recordedVideo', recordedVideoUrl);
      navigate('/share');
    }
  };

  const retakeVideo = () => {
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl('');
    }
    setRecordingTime(0);
  };

  useEffect(() => {
    startCamera();
    
    return () => {
      // Очистка ресурсов
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Шапка */}
      <div className="relative z-20 p-4 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>
          
          <h1 className="text-lg font-bold">Запись видео</h1>
          
          <div className="w-20" />
        </div>
      </div>

      {/* Основной контент */}
      <div className="relative flex-1">
        
        {/* Видео превью */}
        <div className="relative w-full h-[calc(100vh-200px)]">
          {isInitializing ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-gray-300">Подключение к камере...</p>
              </div>
            </div>
          ) : cameraError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <Card className="p-6 bg-red-900/20 border-red-500/50">
                <div className="text-center">
                  <Icon name="AlertCircle" size={48} className="text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-red-400 mb-2">Ошибка камеры</h3>
                  <p className="text-gray-300 mb-4">{cameraError}</p>
                  <Button 
                    onClick={startCamera}
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    Попробовать снова
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />
              
              {/* Индикатор записи */}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-2 rounded-lg">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white font-bold">{formatTime(recordingTime)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Управление записью */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-6">
          
          {!recordedVideoUrl ? (
            <div className="flex items-center justify-center">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!!cameraError || isInitializing}
                size="lg"
                className={`w-20 h-20 rounded-full text-white border-4 ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700 border-red-400' 
                    : 'bg-white/10 hover:bg-white/20 border-white'
                }`}
              >
                {isRecording ? (
                  <div className="w-6 h-6 bg-white rounded-sm"></div>
                ) : (
                  <div className="w-8 h-8 bg-red-600 rounded-full"></div>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <Button
                onClick={retakeVideo}
                variant="outline"
                className="flex-1 border-white/30 text-white hover:bg-white/10"
              >
                <Icon name="RotateCcw" size={20} className="mr-2" />
                Переснять
              </Button>
              
              <Button
                onClick={handleNext}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Icon name="ArrowRight" size={20} className="mr-2" />
                Далее
              </Button>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default Record;