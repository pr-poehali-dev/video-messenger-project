import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface MessengerButtonsProps {
  onTelegramShare: () => void;
  onWhatsAppShare: () => void;
  onViberShare: () => void;
  onUniversalShare: () => void;
  isSharing: boolean;
  hasUniversalShare: boolean;
}

const MessengerButtons: React.FC<MessengerButtonsProps> = ({
  onTelegramShare,
  onWhatsAppShare,
  onViberShare,
  onUniversalShare,
  isSharing,
  hasUniversalShare
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-center mb-6">Выберите мессенджер</h2>
      
      {/* Telegram */}
      <Button
        onClick={onTelegramShare}
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
        onClick={onWhatsAppShare}
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
        onClick={onViberShare}
        disabled={isSharing}
        className="w-full h-16 bg-[#665CAC] hover:bg-[#5A5099] text-white text-lg font-semibold rounded-xl flex items-center justify-center gap-4 transition-all duration-300 hover:scale-[1.02]"
      >
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
          <Icon name="Phone" size={20} className="text-[#665CAC]" />
        </div>
        {isSharing ? 'Отправка...' : 'Viber'}
      </Button>

      {/* Универсальная отправка (Web Share API) */}
      {hasUniversalShare && (
        <Button
          onClick={onUniversalShare}
          variant="outline"
          className="w-full h-16 border-gray-600 text-white hover:bg-gray-800 text-lg font-semibold rounded-xl flex items-center justify-center gap-4"
        >
          <Icon name="Share" size={24} />
          Другие приложения
        </Button>
      )}

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
  );
};

export default MessengerButtons;