import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface AppState {
  isAuth: boolean;
  setAuth: () => void;
  removeAuth: () => void;

  wizUrl: string;

  espIp: string;
  deviceId: string;

  sqsUrl: string;
  mediaUrl: string;

  awsAccessKey: string;
  awsSecretKey: string;

  setEsp32: (url: string) => void;
  setDeviceInfo: (arg: {
    espIp: string;
    deviceId: string;

    sqsUrl: string;
    mediaUrl: string;

    awsAccessKey: string;
    awsSecretKey: string;

    wizUrl: string;
  }) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    immer((set) => ({
      isAuth: false,
      setAuth: () => set(() => ({ isAuth: true })),
      removeAuth: () => set(() => ({ isAuth: false, deviceId: "" })),

      espIp: "ws://echo.websocket.org",
      deviceId: "",

      sqsUrl: "",
      mediaUrl: "",

      awsAccessKey: "",
      awsSecretKey: "",

      wizUrl: "",

      setDeviceInfo: (arg) => set(() => ({ ...arg })),
      setEsp32: (url) => set(() => ({ espIp: url })),
    })),
    {
      name: "bear-storage",
      storage: createJSONStorage(() => AsyncStorage),
      version: 0.01,
    }
  )
);
