import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface AppState {
  isAuth: boolean;
  setAuth: () => void;
  removeAuth: () => void;

  deviceId: string;
  setDeviceId: (deviceId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    immer((set) => ({
      isAuth: false,
      setAuth: () => set(() => ({ isAuth: true })),
      removeAuth: () => set(() => ({ isAuth: false, deviceId: "" })),

      deviceId: "",
      setDeviceId: (deviceId) => set(() => ({ deviceId })),
    })),
    {
      name: "bear-storage",
      storage: createJSONStorage(() => AsyncStorage),
      version: 0.01,
    }
  )
);
