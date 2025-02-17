import { useEffect } from "react";
import { BackHandler } from "react-native";

export const useBackHandler = () => {
  useEffect(() => {
    const onBackPress = () => {
      BackHandler.exitApp();
      return true;
    };
    const backhandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );
    return () => {
      backhandler.remove();
    };
  }, []);

  return null;
};
