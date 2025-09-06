export const initTelegramWebApp = () => {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    
    tg.ready();
    tg.expand();
    
    tg.MainButton.setText('Закрыть');
    tg.MainButton.onClick(() => {
      tg.close();
    });
    
    return {
      user: tg.initDataUnsafe?.user,
      colorScheme: tg.colorScheme,
      themeParams: tg.themeParams,
      initData: tg.initData,
      version: tg.version,
      platform: tg.platform,
    };
  }
  
  return null;
};

export const showMainButton = (text, onClick) => {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.MainButton.setText(text);
    tg.MainButton.show();
    tg.MainButton.onClick(onClick);
  }
};

export const hideMainButton = () => {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.MainButton.hide();
  }
};

export const showBackButton = (onClick) => {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.BackButton.show();
    tg.BackButton.onClick(onClick);
  }
};

export const hideBackButton = () => {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.BackButton.hide();
  }
};

export const showAlert = (message) => {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.showAlert(message);
  } else {
    alert(message);
  }
};

export const showConfirm = (message, callback) => {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.showConfirm(message, callback);
  } else {
    const result = window.confirm(message);
    callback(result);
  }
};

export const hapticFeedback = (type = 'light') => {
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
    const feedback = window.Telegram.WebApp.HapticFeedback;
    
    switch (type) {
      case 'light':
        feedback.impactOccurred('light');
        break;
      case 'medium':
        feedback.impactOccurred('medium');
        break;
      case 'heavy':
        feedback.impactOccurred('heavy');
        break;
      case 'error':
        feedback.notificationOccurred('error');
        break;
      case 'success':
        feedback.notificationOccurred('success');
        break;
      case 'warning':
        feedback.notificationOccurred('warning');
        break;
      default:
        feedback.selectionChanged();
    }
  }
};