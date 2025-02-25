import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { useBoolean, useCounter, useDebounce } from "ahooks";
import axios from "axios";
import _ from "lodash";
import { asyncMap } from "modern-async";
import moment from "moment";
import React, { FC, useEffect, useMemo, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { Spinner, Text, View } from "tamagui";
import { RenderImage, RenderImageBlock, RenderVideo } from "../component";
import { CHECK_DEVICE_STATUS, MEDIA_URL } from "../constants";
import { useBackHandler } from "../hooks/useBackHandler";
import { useAppStore } from "../store";
import { IDeviceResposne, IGetDeviceInfo } from "../types";
import {
  getRegion,
  isIp,
  isValidImage,
  isValidVideo,
  mediaCaching,
} from "../utils";
import { manageLoop } from "../utils/media";

const RenderMeidaScreen: FC<{ reset: VoidFunction }> = ({ reset }) => {
  useBackHandler();

  const {
    deviceId,
    sqsUrl,
    awsAccessKey,
    awsSecretKey,
    espIp,
    wizUrl,
    setEsp32,
  } = useAppStore();

  const { lastMessage, readyState } = useWebSocket(espIp, {
    shouldReconnect: () => true,
    reconnectInterval: 10 * 1000,
    reconnectAttempts: Number.POSITIVE_INFINITY,
  });

  const [counter, { inc }] = useCounter(0);
  const [isLoading, { set: setIsLoading }] = useBoolean(true);
  const [isShowAD, { set: setIsShowAD }] = useBoolean(true);
  const [isPopupModal, { set: setIsPopupModal }] = useBoolean(false);

  const [imgUri, setImgUri] = useState("");
  const [videoUri, setVideoUri] = useState("");
  const [rawData, setRawData] = useState<IGetDeviceInfo[]>([]);

  const debouncedIsPopupModal = useDebounce(isPopupModal, { wait: 500 });

  const SQS_CLIENT = useMemo(() => {
    return new SQSClient({
      region: getRegion(sqsUrl),
      credentials: {
        accessKeyId: awsAccessKey! as string,
        secretAccessKey: awsSecretKey as string,
      },
    });
  }, [sqsUrl, awsAccessKey, awsSecretKey]);

  useEffect(() => {
    const sqlFn = async () => {
      try {
        const QUE_URI = sqsUrl;

        const { Messages } = await SQS_CLIENT.send(
          new ReceiveMessageCommand({
            QueueUrl: QUE_URI,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 10,
            MessageAttributeNames: ["All"],
          })
        );

        let shouldRefetch = false;

        if (_.isArray(Messages)) {
          await asyncMap(Messages, async (item) => {
            try {
              if (item.Body?.includes("Check ads")) {
                shouldRefetch = true;

                await SQS_CLIENT.send(
                  new DeleteMessageCommand({
                    QueueUrl: QUE_URI,
                    ReceiptHandle: item.ReceiptHandle,
                  })
                );
              }
            } catch (err) {
              console.log("Err : ", err);
            }
          });
        }

        if (shouldRefetch) {
          reset();
          inc();
        }
      } catch (err) {}
    };

    const interval = setInterval(sqlFn, 10 * 1000);
    return () => clearInterval(interval);
  }, [SQS_CLIENT, sqsUrl]);

  useEffect(() => {
    if (!deviceId) return;

    const timerFn = setInterval(() => {
      (async () => {
        if (
          readyState === ReadyState.OPEN &&
          espIp !== "ws://echo.websocket.org"
        )
          return;

        try {
          const response = await axios.post<IDeviceResposne>(
            CHECK_DEVICE_STATUS,
            {
              WizzString: wizUrl,
              deviceID: deviceId,
            }
          );

          if (response.data.isOk === true) {
            if (isIp(response?.data?.ESP32_IP || "")) {
              setEsp32(`ws://${response.data.ESP32_IP}:81`);
            }
          }
        } catch (err) {
          console.log("Err : ", err);
        }
      })();
    }, 5 * 1000);

    return () => {
      clearInterval(timerFn);
    };
  }, [deviceId, readyState, wizUrl]);

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      const isMotionDetected =
        JSON.parse(lastMessage?.data || "{}")?.motion === 1;

      if (isMotionDetected) {
        setIsPopupModal(true);
      }
    }
  }, [readyState, lastMessage]);

  useEffect(() => {
    if (debouncedIsPopupModal === true) {
      _.delay(() => {
        setIsPopupModal(false);
      }, 5 * 1000);
    }
  }, [debouncedIsPopupModal]);

  useEffect(() => {
    (async () => {
      counter === 0 && setIsLoading(true);

      try {
        const response = await axios.get<IGetDeviceInfo[]>(
          MEDIA_URL + "/" + deviceId
        );

        if (_.isArray(response.data)) {
          setRawData(response.data);

          if (!_.isEmpty(response.data) && response.data.length !== 0) {
            const mediaUri = response.data[0]?.mediaUrl[0];

            try {
              await asyncMap(response.data, async (item) => {
                try {
                  await mediaCaching(item.mediaUrl[0]);
                } catch (err) {}
              });
            } catch (err) {}

            resetMedia();

            if (isValidImage(mediaUri)) {
              setImgUri(mediaUri);
            } else if (isValidVideo(mediaUri)) {
              setVideoUri(mediaUri);
            }
          } else {
            setIsShowAD(false);
          }
        }
      } catch (err) {
        console.log("Err:", err);
      }

      counter === 0 && setIsLoading(false);
    })();
  }, [deviceId, counter]);

  useEffect(() => {
    if (!_.isArray(rawData) || rawData.length === 0) return;

    manageLoop({ rawData, setImgUri, setVideoUri, resetMedia });
  }, [rawData]);

  useEffect(() => {
    const checkTime = () => {
      if (
        _.isArray(rawData) &&
        rawData.length !== 0 &&
        rawData[0]?.startTime &&
        rawData[0]?.endTime
      ) {
        const endTime = moment(rawData[0].endTime);
        const startTime = moment(rawData[0].startTime);

        if (moment().isBetween(startTime, endTime)) {
          setIsShowAD(true);
        } else {
          setIsShowAD(false);
        }
      }
    };

    const interval = setInterval(checkTime, 10 * 1000);

    return () => clearInterval(interval);
  }, [rawData]);

  const resetMedia = () => {
    setImgUri("");
    setVideoUri("");
  };

  if (isLoading === true) {
    return (
      <View
        flex={1}
        bg={"black"}
        justifyContent={"center"}
        alignItems={"center"}
      >
        <Spinner size={"large"} />
      </View>
    );
  }

  if (isShowAD === true) {
    return (
      <>
        <View
          flex={1}
          bg={"black"}
          justifyContent={"center"}
          alignItems={"center"}
        >
          <RenderImage imgUri={imgUri} />
          <RenderVideo videoUri={videoUri} />
        </View>

        <RenderImageBlock isPopupModal={isPopupModal} />
      </>
    );
  }

  return (
    <>
      <View
        flex={1}
        bg={"black"}
        justifyContent={"center"}
        alignItems={"center"}
      >
        <Text color={"white"} fontSize={"$9"}>
          No Eligible Media to Play
        </Text>
      </View>
      <RenderImageBlock isPopupModal={isPopupModal} />
    </>
  );
};

const Media = () => {
  const [key, setKey] = useState(Math.random().toString());

  const resetKey = () => setKey(Math.random().toString());

  return <RenderMeidaScreen key={key} reset={resetKey} />;
};

export default Media;
