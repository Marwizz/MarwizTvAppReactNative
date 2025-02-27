import { MaterialIcons } from "@expo/vector-icons";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import axios from "axios";
import * as ScreenOrientation from "expo-screen-orientation";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Button, Image, Text, View } from "tamagui";
import {
  CHECK_DEVICE_STATUS,
  CREATE_WIZZ_ID,
  deviceName,
  GET_DEVICE_ID,
  screenHeight,
  screenWidth,
} from "../constants";
import { IRootStackParamList } from "../Routes";
import { useAppStore } from "../store";
import { IDeviceResposne } from "../types";
import { isIp } from "../utils";

const Auth = () => {
  const { setDeviceInfo, setAuth } = useAppStore();

  const [tempDeviceId, setTempDeviceId] = useState<null | string>("");
  const [rotation, setRotation] = useState(0);
  const [wizzUrl, setWizzUrl] = useState(null);
  const [wizzString, setWizzString] = useState(null);
  const [isWizzStringValid, setIsWizzStringValid] = useState(false);

  const { navigate } = useNavigation<NavigationProp<IRootStackParamList>>();

  useEffect(() => {
    (async () => {
      const isPortrait = screenHeight >= screenWidth;

      if (isPortrait === false) {
        setRotation(90);

        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE
        );
      } else {
        setRotation(0);

        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT
        );
      }
    })();
  }, [screenHeight, screenWidth]);

  useEffect(() => {
    if (!tempDeviceId) return;
    if (!wizzString) return;

    const timerFn = setInterval(() => {
      (async () => {
        try {
          const response = await axios.post<IDeviceResposne>(
            CHECK_DEVICE_STATUS,
            {
              WizzString: wizzString,
              deviceID: tempDeviceId,
            }
          );

          if (response.data.isOk === true) {
            setDeviceInfo({
              awsAccessKey: response.data.AWS_ACCESS_KEY,
              awsSecretKey: response.data.AWS_SECRET_KEY,
              deviceId: tempDeviceId,
              espIp: isIp(response.data.ESP32_IP)
                ? `ws://${response.data.ESP32_IP}:81`
                : "ws://echo.websocket.org",
              mediaUrl: response.data.base_URL,
              sqsUrl: response.data.sqs_url,
              wizUrl: wizzString,
            });

            setAuth();
            navigate("media");
          }
        } catch (err) {
          console.log(err);
        }
      })();
    }, 5 * 1000);

    return () => {
      clearInterval(timerFn);
    };
  }, [tempDeviceId, wizzString]);

  useEffect(() => {
    getDeviceName();
  }, []);

  useEffect(() => {
    if (wizzString) {
      const interval = setInterval(() => {
        if (!isWizzStringValid) {
          checkWizzStringStatus(wizzString);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [wizzString, isWizzStringValid]);

  const toggleOrientation = async () => {
    const newRotation = (rotation + 90) % 360;
    let newOrientation;
    if (newRotation === 0)
      newOrientation = ScreenOrientation.OrientationLock.PORTRAIT_UP;
    else if (newRotation === 90)
      newOrientation = ScreenOrientation.OrientationLock.LANDSCAPE_LEFT;
    else if (newRotation === 180)
      newOrientation = ScreenOrientation.OrientationLock.PORTRAIT_DOWN;
    else newOrientation = ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT;

    await ScreenOrientation.lockAsync(newOrientation);
    setRotation(newRotation);
  };

  const getDeviceName = async () => {
    await axios
      .post(CREATE_WIZZ_ID, { deviceName })
      .then((response) => {
        setWizzUrl(response.data.WizzUrl);
        setWizzString(response.data.WizzString);
      })
      .catch((error) => console.log(error));
  };

  const checkWizzStringStatus = async (wizzString: any) => {
    const res = await axios.get(`${GET_DEVICE_ID}/${wizzString}`);

    if (res.data && res.data.deviceId) {
      setTempDeviceId(res.data.deviceId);
      setIsWizzStringValid(true);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        bg={"white"}
        flex={1}
        flexDirection={rotation % 180 === 0 ? "column" : "row"}
      >
        <View flex={1} bg={"#405582"}>
          <Image
            src={require("../assets/img/marwiz_logo.png")}
            height={"100%"}
            width={"100%"}
          />
        </View>
        <View
          flex={1}
          justifyContent={"center"}
          p={"$4"}
          gap={"$6"}
          alignItems={"center"}
          position="relative"
        >
          {wizzUrl && <QRCode value={wizzUrl} size={200} />}
          <Button
            height={"$5"}
            width={"$5"}
            p={"$1"}
            bg={"#C8D4E9"}
            elevationAndroid={2}
            right="$6"
            bottom="$7"
            position="absolute"
            onPress={toggleOrientation}
          >
            <MaterialIcons name="screen-rotation" size={24} color={"#000"} />
          </Button>
          {isWizzStringValid ? (
            <Text>Authenticated. Proceeding to the next step...</Text>
          ) : (
            <Text>Scan the QR code to login</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Auth;
