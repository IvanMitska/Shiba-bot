export const getTelegramWebApp = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  
  // Fallback для разработки
  return {
    ready: () => console.log('WebApp ready'),
    expand: () => console.log('WebApp expanded'),
    close: () => console.log('WebApp closed'),
    setHeaderColor: (color) => console.log('Header color set to:', color),
    setBackgroundColor: (color) => console.log('Background color set to:', color),
    BackButton: {
      show: () => console.log('Back button shown'),
      hide: () => console.log('Back button hidden'),
      onClick: (callback) => console.log('Back button click handler set')
    },
    MainButton: {
      show: () => console.log('Main button shown'),
      hide: () => console.log('Main button hidden'),
      setText: (text) => console.log('Main button text:', text),
      onClick: (callback) => console.log('Main button click handler set')
    },
    HapticFeedback: {
      impactOccurred: (style) => console.log('Haptic impact:', style),
      notificationOccurred: (type) => console.log('Haptic notification:', type),
      selectionChanged: () => console.log('Haptic selection changed')
    },
    initDataUnsafe: {
      user: {
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser'
      }
    },
    themeParams: {
      bg_color: '#ffffff',
      text_color: '#000000',
      hint_color: '#999999',
      link_color: '#2481cc',
      button_color: '#2481cc',
      button_text_color: '#ffffff',
      secondary_bg_color: '#f4f4f5'
    }
  };
};

export const validateTelegramWebAppData = (initData) => {
  // В продакшене здесь должна быть валидация подписи данных
  // с использованием секретного ключа бота
  return true;
};