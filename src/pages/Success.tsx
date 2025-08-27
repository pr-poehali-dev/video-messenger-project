import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const Success: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Очищаем сохраненное видео
    const videoUrl = sessionStorage.getItem('recordedVideo');
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      sessionStorage.removeItem('recordedVideo');
    }
    sessionStorage.removeItem('videoForShare');
    sessionStorage.removeItem('shareMessage');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-900 text-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 bg-black/40 backdrop-blur-sm border-green-500/30 text-center">
        
        {/* Иконка успеха */}
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon name="Check" size={40} className="text-white" />
        </div>

        {/* Заголовок */}
        <h1 className="text-3xl font-bold text-green-400 mb-4">
          Успешно!
        </h1>

        {/* Описание */}
        <div className="space-y-4 mb-8">
          <p className="text-lg text-green-200">
            Видео готово к отправке
          </p>
          
          <div className="text-sm text-gray-300 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Icon name="CheckCircle" size={16} className="text-green-400" />
              <span>Записано с тыловой камеры</span>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <Icon name="CheckCircle" size={16} className="text-green-400" />
              <span>Звук включен</span>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <Icon name="CheckCircle" size={16} className="text-green-400" />
              <span>Геолокация добавлена</span>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <Icon name="CheckCircle" size={16} className="text-green-400" />
              <span>Готово для мессенджеров</span>
            </div>
          </div>
        </div>

        {/* Кнопки */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/')}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
          >
            <Icon name="Plus" size={20} className="mr-2" />
            Записать новый лид
          </Button>
          
          <Button
            onClick={() => navigate('/share')}
            variant="outline"
            className="w-full border-green-500/50 text-green-400 hover:bg-green-500/10 py-3"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Вернуться к отправке
          </Button>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-8 pt-6 border-t border-green-500/20">
          <p className="text-xs text-gray-400 mb-2">
            IMPERIA PROMO
          </p>
          <p className="text-xs text-gray-500">
            Лид записан {new Date().toLocaleString('ru-RU')}
          </p>
        </div>
        
      </Card>
    </div>
  );
};

export default Success;