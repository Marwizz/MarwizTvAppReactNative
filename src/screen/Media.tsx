import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
} from "@aws-sdk/client-sqs";
import { useBoolean, useCounter, useDebounce } from "ahooks";
import axios from "axios";
import _ from "lodash";
import { asyncMap } from "modern-async";
import moment from "moment";
import React, { FC, useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { Spinner, Text, View } from "tamagui";
import { RenderImage, RenderImageBlock, RenderVideo } from "../component";
import { BASE_WEBSOCKET_URI, MEDIA_URL, SQS_CLIENT } from "../constants";
import { useBackHandler } from "../hooks/useBackHandler";
import { useAppStore } from "../store";
import { IGetDeviceInfo } from "../types";
import { getSQSUri, isValidImage, isValidVideo, mediaCaching } from "../utils";

const RenderMeidaScreen: FC<{ reset: VoidFunction }> = ({ reset }) => {
  useBackHandler();

  const { lastMessage, readyState } = useWebSocket(BASE_WEBSOCKET_URI, {
    shouldReconnect: () => true,
    reconnectInterval: 10 * 1000,
    reconnectAttempts: Number.POSITIVE_INFINITY,
  });

  const [counter, { inc }] = useCounter(0);
  const [isLoading, { set: setIsLoading }] = useBoolean(true);
  const [isShowAD, { set: setIsShowAD }] = useBoolean(true);
  const [isPopupModal, { set: setIsPopupModal }] = useBoolean(false);

  const { deviceId } = useAppStore();
  const [imgUri, setImgUri] = useState("");
  const [videoUri, setVideoUri] = useState("");
  const [rawData, setRawData] = useState<IGetDeviceInfo[]>([]);

  const debouncedIsPopupModal = useDebounce(isPopupModal, { wait: 500 });

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
      } catch (error) {
        console.log(error);
      }

      counter === 0 && setIsLoading(false);
    })();
  }, [deviceId, counter]);

  useEffect(() => {
    (async () => {
      if (!_.isArray(rawData)) return;
      if (rawData.length === 0) return;

      let delayTime = 0;
      let delayIndex = -1;

      for (let index = 0; index < rawData.length; index++) {
        const item = rawData[index];
        if (item.mediaUrl[0] === imgUri || item.mediaUrl[0] === videoUri) {
          delayTime = _.toNumber(item.duration) * 1000;
          delayIndex = index;
        }
      }

      if (delayIndex === -1) return;

      while (true) {
        await new Promise((r) => setTimeout(r, delayTime));

        resetMedia();

        let mediaUri;

        if (delayIndex < rawData.length - 1) {
          mediaUri = rawData[delayIndex + 1]?.mediaUrl[0];
        } else {
          mediaUri = rawData[0]?.mediaUrl[0];
        }

        if (isValidImage(mediaUri)) {
          setImgUri(mediaUri);
        } else if (isValidVideo(mediaUri)) {
          setVideoUri(mediaUri);
        }

        delayIndex = _.toInteger((delayIndex + 1) % rawData.length);
      }
    })();
  }, [rawData]);

  useEffect(() => {
    const checkTime = () => {
      if (
        _.isArray(rawData) &&
        rawData.length !== 0 &&
        rawData[0]?.startTime &&
        rawData[0]?.endTime
      ) {
        const startTime = moment(rawData[0].startTime);
        const endTime = moment(rawData[0].endTime);

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

  useEffect(() => {
    const sqlFn = async () => {
      try {
        const QUE_URI = getSQSUri(deviceId);

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

    const interval = setInterval(sqlFn, 1 * 1000);
    return () => clearInterval(interval);
  }, []);

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

  const resetKey = () => {
    setKey(Math.random().toString());
  };

  return <RenderMeidaScreen key={key} reset={resetKey} />;
};

export default Media;
