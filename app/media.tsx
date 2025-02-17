import "react-native-get-random-values";

import {
  MEDIA_BASE_URL,
  MEDIA_URL,
  screenHeight,
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
import { useEvent } from "expo";
import { useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import _ from "lodash";
import { asyncMap } from "modern-async";
import moment from "moment";
import React, { useEffect, useState } from "react";
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

  const player = useVideoPlayer(MEDIA_BASE_URL + videoUri, (player) => {
    player.loop = false;
    player.play();
  });

  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
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
          await asyncMap(Messages, async (item) => {
            await SQS_CLIENT.send(
              new DeleteMessageCommand({
                QueueUrl: QUE_URI,
                ReceiptHandle: item.ReceiptHandle,
              })
            );
          });

          inc();
        }
      } catch (err) {}
    };

    const interval = setInterval(sqlFn, 10 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (videoUri && isPlaying === false) {
      handleMediaLoad();
    }
  }, [isPlaying, videoUri]);

  const resetMedia = () => {
    setImgUri("");
    setVideoUri("");
  };

  const handleMediaLoad = () => {
    let delayTime = 0;
    let delayIndex = 0;

    rawData.forEach((item: any, index) => {
      if (item.mediaUrl[0] === imgUri) {
        delayTime = item.duration * 1000;
        delayIndex = index;
      }
    });

    _.delay(() => {
      resetMedia();

      if (delayIndex < rawData.length - 1) {
        const mediaUri = rawData[delayIndex + 1]?.mediaUrl[0];

        if (isValidImage(mediaUri)) {
          setImgUri(mediaUri);
        } else if (isValidVideo(mediaUri)) {
          setVideoUri(mediaUri);
        }
      } else {
        const mediaUri = rawData[0]?.mediaUrl[0];

        if (isValidImage(mediaUri)) {
          setImgUri(mediaUri);
        } else if (isValidVideo(mediaUri)) {
          setVideoUri(mediaUri);
        }
      }
    }, delayTime);
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
            onLoad={handleMediaLoad}
          />
        )}

        {videoUri && (
          <VideoView
            style={{
              width: 350,
              height: 275,
            }}
            player={player}
            allowsFullscreen
            allowsPictureInPicture
            nativeControls={false}
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
