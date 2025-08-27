import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const Start: React.FC = () => {
  const shareVideo = async () => {
    try {
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
      if (navigator.share) {
        try {
          await navigator.share({
            title: '🎥 Новый лид IMPERIA PROMO',
            text: message,
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
      
      // Fallback: открытие Telegram с текстом
      const encodedMessage = encodeURIComponent(message);
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Мобильные: открываем Telegram
        window.location.href = `tg://msg?text=${encodedMessage}`;
        
        // Fallback через веб
        setTimeout(() => {
          window.open(`https://t.me/share/url?url=${encodedMessage}`, '_blank');
        }, 1000);
        
        alert('📱 Откроется Telegram\n\nОтправьте сообщение нужному получателю');
      } else {
        // Desktop: Telegram Web
        window.open(`https://web.telegram.org/a/#?text=${encodedMessage}`, '_blank');
        alert('💻 Откроется Telegram Web\n\nВыберите чат и отправьте сообщение');
      }
      
      setTimeout(() => {
        window.location.href = '/success';
      }, 2000);
      
    } catch (error) {
      console.error('Ошибка отправки:', error);
      alert('Ошибка при отправке сообщения. Попробуйте ещё раз.');
    }
  };

  return (
    <div className="min-h-screen bg-background font-inter">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          
          {/* Заголовок */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-foreground">
              IMPERIA PROMO
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Быстрая отправка сообщений в Telegram
            </p>
          </div>

          {/* Главная карточка */}
          <Card className="p-8 text-center bg-card border-0 shadow-lg">
            <div className="space-y-6">
              
              {/* Иконка */}
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-[#0088CC] rounded-full flex items-center justify-center">
                  <Icon name="Send" size={32} className="text-white" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-3 text-foreground">
                  Отправить лид
                </h2>
                <p className="text-muted-foreground mb-6">
                  Нажмите кнопку ниже, чтобы отправить информацию о новом лиде в Telegram
                </p>
              </div>

              {/* Кнопка отправки */}
              <Button
                onClick={shareVideo}
                size="lg"
                className="w-full max-w-md bg-[#0088CC] hover:bg-[#0077B5] text-white text-lg py-4 px-8"
              >
                <Icon name="Send" size={20} className="mr-3" />
                Отправить в Telegram
              </Button>

              {/* Дополнительная информация */}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Будет отправлено сообщение с текущей датой и геолокацией
                </p>
              </div>

            </div>
          </Card>

          {/* Нижняя секция */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Для записи видео перейдите на{' '}
              <a href="/camera" className="text-[#0088CC] hover:underline font-medium">
                страницу камеры
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Start;