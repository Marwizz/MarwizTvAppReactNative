import AsyncStorage from "@react-native-async-storage/async-storage";
import { useKeepAwake } from "expo-keep-awake";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { Text, View } from "tamagui";

const Main = () => {
  const [loading, setLoading] = useState(true);
  const [deviceID, setDeviceID] = useState<string | null>(null);

  useKeepAwake();

  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        const storedDeviceID = await AsyncStorage.getItem("deviceId");
        setDeviceID(storedDeviceID);
      } catch (error) {}

      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (deviceID) {
        router.replace(`/media?deviceID=${deviceID}`);
      } else {
        router.replace("/auth");
      }
    }
  }, [loading, deviceID]);

  return (
    <View
      flex={1}
      justifyContent="center"
      alignItems="center"
      style={{ backgroundColor: "white" }}
    >
      <Text style={{ fontSize: 20 }}>Checking device ID...</Text>
      <ActivityIndicator size="large" color="#405582" />
    </View>
  );
};

export default Main;
