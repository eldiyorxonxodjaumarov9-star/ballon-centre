"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { TelegramUser } from "@/types";

interface TelegramContextValue {
  ready: boolean;
  isTelegram: boolean;
  user: TelegramUser | null;
  initData: string;
  colorScheme: "dark" | "light";
  viewportHeight: number;
}

const TelegramContext = createContext<TelegramContextValue>({
  ready: false,
  isTelegram: false,
  user: null,
  initData: "",
  colorScheme: "dark",
  viewportHeight: 0,
});

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TelegramContextValue>({
    ready: false,
    isTelegram: false,
    user: null,
    initData: "",
    colorScheme: "dark",
    viewportHeight: 0,
  });

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) {
      setState((prev) => ({ ...prev, ready: true, isTelegram: false }));
      return;
    }

    try {
      webApp.ready();
      webApp.expand();
      webApp.setHeaderColor("#3f2a9b");
      webApp.setBackgroundColor("#0a0618");
    } catch {
      // Older Telegram WebApp versions do not support all methods.
    }

    const user = webApp.initDataUnsafe?.user
      ? {
          id: webApp.initDataUnsafe.user.id,
          first_name: webApp.initDataUnsafe.user.first_name,
          last_name: webApp.initDataUnsafe.user.last_name,
          username: webApp.initDataUnsafe.user.username,
          language_code: webApp.initDataUnsafe.user.language_code,
          photo_url: webApp.initDataUnsafe.user.photo_url,
        }
      : null;

    setState({
      ready: true,
      isTelegram: Boolean(webApp.initData),
      user,
      initData: webApp.initData,
      colorScheme: webApp.colorScheme === "light" ? "light" : "dark",
      viewportHeight: webApp.viewportHeight || window.innerHeight,
    });

    const onViewport = () => {
      setState((prev) => ({
        ...prev,
        viewportHeight: webApp.viewportHeight || window.innerHeight,
      }));
    };

    webApp.onEvent("viewportChanged", onViewport);
    return () => webApp.offEvent("viewportChanged", onViewport);
  }, []);

  const value = useMemo(() => state, [state]);

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
}

export function useTelegram() {
  return useContext(TelegramContext);
}

export function haptic(type: "light" | "medium" | "success" | "error" = "light") {
  const webApp = window.Telegram?.WebApp;
  const hapticFeedback = webApp?.HapticFeedback;
  if (!hapticFeedback || !webApp?.isVersionAtLeast?.("6.1")) return;
  if (type === "success" || type === "error") {
    hapticFeedback.notificationOccurred(type);
    return;
  }
  hapticFeedback.impactOccurred(type);
}

export function openTelegramLink(url: string) {
  const webApp = window.Telegram?.WebApp;
  try {
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(url);
      return;
    }
  } catch {
    // Older Telegram WebApp versions fall back to a normal link.
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export function requestTelegramLocation(): Promise<{ lat: number; lng: number }> {
  const webApp = window.Telegram?.WebApp;
  const manager = webApp?.LocationManager;

  const fromBrowser = () =>
    new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Qurilmada GPS yo‘q"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => reject(new Error("Joylashuv ruxsati berilmadi")),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
      );
    });

  if (!manager) return fromBrowser();

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      void fromBrowser().then(resolve).catch(reject);
    }, 8000);

    const finish = (location: { latitude?: number; longitude?: number } | null) => {
      window.clearTimeout(timeout);
      if (!location || typeof location.latitude !== "number" || typeof location.longitude !== "number") {
        void fromBrowser().then(resolve).catch(reject);
        return;
      }
      resolve({ lat: location.latitude, lng: location.longitude });
    };

    try {
      manager.init(() => {
        if (manager.isAccessRequested && !manager.isAccessGranted) {
          try {
            manager.openSettings();
          } catch {
            // Older Telegram clients may not support settings.
          }
        }
        manager.getLocation(finish);
      });
    } catch {
      window.clearTimeout(timeout);
      void fromBrowser().then(resolve).catch(reject);
    }
  });
}
