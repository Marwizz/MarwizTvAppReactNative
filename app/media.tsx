import "react-native-get-random-values";

import {
  MEDIA_BASE_URL,
  MEDIA_URL,
  screenHeight,
  screenWidth,
  SQS_CLIENT,
} from "@/constants";
import { useBackHandler } from "@/hooks/useBackHandler";
import { IGetDeviceInfo } from "@/types";
import { isValidImage, isValidVideo } from "@/utils";
import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
} from "@aws-sdk/client-sqs";
import { useBoolean, useCounter } from "ahooks";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import _ from "lodash";
import { asyncMap } from "modern-async";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { Image, Spinner, Text, View } from "tamagui";

const Media = () => {
  useBackHandler();

  const param = useLocalSearchParams();
  const [counter, { inc }] = useCounter(0);

  const [isLoading, { set: setIsLoading }] = useBoolean(true);
  const [isShowAD, { set: setIsShowAD }] = useBoolean(true);

  const [deviceID, setDeviceID] = useState("");
  const [imgUri, setImgUri] = useState("");
  const [videoUri, setVideoUri] = useState("");
  const [rawData, setRawData] = useState<IGetDeviceInfo[]>([]);

  const videoRef = useRef<VideoView>(null);

  const player = useVideoPlayer(MEDIA_BASE_URL + videoUri, (player) => {
    player.loop = false;
    player.play();
  });

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
    if (player.status === "readyToPlay") {
      videoRef.current?.enterFullscreen();
    }
  }, [player]);

  useEffect(() => {
    if ("deviceID" in param && typeof param.deviceID === "string") {
      if (param.deviceID !== deviceID) {
        setDeviceID(param.deviceID);
      }
    }
  }, [param]);

  useEffect(() => {
    (async () => {
      counter === 0 && setIsLoading(true);

      try {
        const response = await axios.get<IGetDeviceInfo[]>(
          MEDIA_URL + "/" + deviceID
        );

        if (_.isArray(response.data)) {
          setRawData(response.data);

          if (!_.isEmpty(response.data) && response.data.length !== 0) {
            const mediaUri = response.data[0]?.mediaUrl[0];

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
      } catch (error) {}

      counter === 0 && setIsLoading(false);
    })();
  }, [deviceID, counter]);

  useEffect(() => {
    const sqlFn = async () => {
      try {
        const QUE_URI = `https://sqs.eu-north-1.amazonaws.com/761018874223/tv-app`;

        const { Messages } = await SQS_CLIENT.send(
          new ReceiveMessageCommand({
            QueueUrl: QUE_URI,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 10,
            MessageAttributeNames: ["All"],
          })
        );

        if (_.isArray(Messages)) {
          inc();

          await asyncMap(Messages, async (item) => {
            await SQS_CLIENT.send(
              new DeleteMessageCommand({
                QueueUrl: QUE_URI,
                ReceiptHandle: item.ReceiptHandle,
              })
            );
          });
        }
      } catch (err) {}
    };

    const interval = setInterval(sqlFn, 10 * 1000);
    return () => clearInterval(interval);
  }, []);

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
      <View
        flex={1}
        bg={"black"}
        justifyContent={"center"}
        alignItems={"center"}
      >
        {imgUri && (
          <Image
            src={MEDIA_BASE_URL + imgUri}
            objectFit="contain"
            height={screenHeight}
            width={"100%"}
          />
        )}

        {videoUri && (
          <VideoView
            style={{
              width: screenWidth,
              height: screenHeight,
            }}
            player={player}
            allowsFullscreen={true}
            allowsPictureInPicture
            ref={videoRef}
          />
        )}
      </View>
    );
  }

  return (
    <View flex={1} bg={"black"} justifyContent={"center"} alignItems={"center"}>
      <Text color={"white"} fontSize={"$9"}>
        No Eligible Media to Play
      </Text>
    </View>
  );
};

export default Media;
