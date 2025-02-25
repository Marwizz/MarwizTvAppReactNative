import { useVideoPlayer, VideoView } from "expo-video";
import React, { FC, memo, useEffect, useRef, useState } from "react";
import isEqual from "react-fast-compare";
import { Dialog, Image } from "tamagui";
import {
  MEDIA_BASE_URL,
  screenHeight,
  screenWidth,
  THANK_YOU_URI,
} from "../constants";
import { mediaCaching } from "../utils";

export const RenderImageBlock: FC<{ isPopupModal: boolean }> = memo(
  ({ isPopupModal }) => {
    return (
      <Dialog modal open={isPopupModal}>
        <Dialog.Portal backgroundColor="$colorTransparent">
          <Dialog.Overlay
            key="overlay"
            animation="slow"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            padding={0}
            margin={0}
            borderWidth={0}
            backgroundColor="$colorTransparent"
          />

          <Dialog.Content
            bordered
            elevate
            key="content"
            animateOnly={["transform", "opacity"]}
            animation={[
              "quicker",
              {
                opacity: {
                  overshootClamping: true,
                },
              },
            ]}
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            gap="$4"
            padding={0}
            margin={0}
            borderWidth={0}
            backgroundColor="$colorTransparent"
          >
            <Image
              src={THANK_YOU_URI}
              height={screenHeight / 1.8}
              width={screenWidth / 1.2}
              objectFit="contain"
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    );
  },
  isEqual
);

export const RenderImage: FC<{ imgUri: string }> = memo(({ imgUri }) => {
  const [cacheUri, setCacheUri] = useState("");

  useEffect(() => {
    (async () => {
      const uri = await mediaCaching(imgUri);
      setCacheUri(uri);
    })();
  }, [imgUri]);

  if (!imgUri) return <></>;

  return (
    <Image
      source={{ uri: cacheUri || MEDIA_BASE_URL + imgUri }}
      objectFit="contain"
      height={screenHeight}
      width="100%"
    />
  );
}, isEqual);

export const RenderVideo: FC<{ videoUri: string }> = memo(({ videoUri }) => {
  const [cacheUri, setCacheUri] = useState("");

  useEffect(() => {
    (async () => {
      const uri = await mediaCaching(videoUri);
      setCacheUri(uri);
    })();
  }, [videoUri]);

  const player = useVideoPlayer(
    cacheUri || MEDIA_BASE_URL + videoUri,
    (player) => {
      player.loop = true;
      player.play();
    }
  );

  const videoRef = useRef<VideoView>(null);

  useEffect(() => {
    if (player.status === "readyToPlay") {
      videoRef.current?.enterFullscreen();
    }
  }, [player]);

  if (!videoUri) return <></>;

  return (
    <VideoView
      style={{
        width: screenWidth,
        height: screenHeight,
      }}
      player={player}
      allowsFullscreen={true}
      allowsPictureInPicture
      nativeControls={false}
      ref={videoRef}
    />
  );
}, isEqual);
