import _ from "lodash";
import { IGetDeviceInfo } from "../types";
import { isValidImage, isValidVideo } from "../utils";

let mediaUri = "";

export const manageLoop = async ({
  rawData,
  resetMedia,
  setImgUri,
  setVideoUri,
}: {
  rawData: IGetDeviceInfo[];
  setImgUri: (arg: string) => void;
  setVideoUri: (arg: string) => void;
  resetMedia: VoidFunction;
}) => {
  let delayTime = 0;
  let delayIndex = -1;

  if (!mediaUri) {
    mediaUri = rawData[0]?.mediaUrl[0];
  }

  while (true) {
    for (let index = 0; index < rawData.length; index++) {
      const item = rawData[index];

      if (item.mediaUrl[0] === mediaUri) {
        delayTime = _.toNumber(item.duration) * 1000;
        delayIndex = index;
      }
    }

    if (delayIndex === -1) return;

    try {
      await new Promise((r) => setTimeout(r, delayTime));

      if (delayIndex < rawData.length - 1) {
        mediaUri = rawData[delayIndex + 1]?.mediaUrl[0];
      } else {
        mediaUri = rawData[0]?.mediaUrl[0];
      }

      resetMedia();

      if (isValidImage(mediaUri)) {
        setImgUri(mediaUri);
      } else if (isValidVideo(mediaUri)) {
        setVideoUri(mediaUri);
      }

      delayIndex = _.toInteger((delayIndex + 1) % rawData.length);
    } catch (err) {
      console.log("Err:", err);
    }
  }
};
