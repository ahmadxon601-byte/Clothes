type TelegramMainButton = {
  text?: string;
  color?: string;
  textColor?: string;
  isVisible?: boolean;
  show: () => void;
  hide: () => void;
  enable: () => void;
  disable: () => void;
  setText: (value: string) => void;
};

type TelegramBackButton = {
  show: () => void;
  hide: () => void;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
};

type TelegramHapticFeedback = {
  impactOccurred?: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
  notificationOccurred?: (type: "error" | "success" | "warning") => void;
};

type TelegramUser = {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

type TelegramWebApp = {
  ready?: () => void;
  expand?: () => void;
  initData?: string;
  initDataUnsafe?: {
    user?: TelegramUser;
  };
  MainButton?: TelegramMainButton;
  BackButton?: TelegramBackButton;
  HapticFeedback?: TelegramHapticFeedback;
  onEvent?: (eventName: string, callback: () => void) => void;
  offEvent?: (eventName: string, callback: () => void) => void;
};

type TelegramContainer = {
  WebApp?: TelegramWebApp;
};

type TelegramWindow = Window & {
  Telegram?: TelegramContainer;
};

export type TelegramMainButtonConfig = {
  text: string;
  enabled?: boolean;
  visible?: boolean;
  color?: string;
  textColor?: string;
  onClick?: () => void;
};

const getWebApp = (): TelegramWebApp | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const telegramWindow = window as TelegramWindow;
  return telegramWindow.Telegram?.WebApp ?? null;
};

export const initTelegramWebApp = () => {
  const webApp = getWebApp();
  if (!webApp) {
    return null;
  }

  webApp.ready?.();
  webApp.expand?.();
  return webApp;
};

export const getInitData = () => {
  const webApp = getWebApp();
  return webApp?.initData ?? "";
};

export const getUser = () => {
  const webApp = getWebApp();
  return webApp?.initDataUnsafe?.user ?? null;
};

export const hapticImpact = (style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light") => {
  const webApp = getWebApp();
  webApp?.HapticFeedback?.impactOccurred?.(style);
};

export const hapticNotify = (type: "error" | "success" | "warning" = "success") => {
  const webApp = getWebApp();
  webApp?.HapticFeedback?.notificationOccurred?.(type);
};

export const setMainButton = (config: TelegramMainButtonConfig) => {
  const webApp = getWebApp();
  const mainButton = webApp?.MainButton;

  if (!webApp || !mainButton) {
    return () => {};
  }

  mainButton.setText(config.text);

  if (config.color) {
    mainButton.color = config.color;
  }

  if (config.textColor) {
    mainButton.textColor = config.textColor;
  }

  if (config.enabled === false) {
    mainButton.disable();
  } else {
    mainButton.enable();
  }

  if (config.visible === false) {
    mainButton.hide();
  } else {
    mainButton.show();
  }

  const clickHandler = () => config.onClick?.();
  if (config.onClick && webApp.onEvent) {
    webApp.onEvent("mainButtonClicked", clickHandler);
  }

  return () => {
    if (config.onClick && webApp.offEvent) {
      webApp.offEvent("mainButtonClicked", clickHandler);
    }
  };
};

export const hideMainButton = () => {
  const webApp = getWebApp();
  webApp?.MainButton?.hide();
};

export const setBackButton = (onBack: () => void, visible = true) => {
  const webApp = getWebApp();
  const backButton = webApp?.BackButton;

  if (!webApp || !backButton) {
    return () => {};
  }

  if (visible) {
    backButton.show();
  } else {
    backButton.hide();
  }

  backButton.onClick(onBack);

  return () => {
    backButton.offClick(onBack);
    backButton.hide();
  };
};

// Backward compatible alias for old service calls.
export const configureTelegramMainButton = setMainButton;
export const getTelegramWebApp = getWebApp;
