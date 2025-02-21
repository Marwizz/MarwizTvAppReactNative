import * as FileSystem from "expo-file-system";
import _ from "lodash";
import {
  imgFormate,
  MEDIA_BASE_URL,
  SQS_BASE_URI,
  videoFormate,
} from "./constants";

export const getSQSUri = (deviceId: string) => {
  // return "https://sqs.eu-north-1.amazonaws.com/761018874223/tv-app";
  return SQS_BASE_URI + `/761018874223/device-${deviceId}`;
};

export const isValidImage = (uri: string): boolean => {
  let isValid = false;

  imgFormate.map((item) => {
    if (_.toLower(uri).includes(_.toLower(item))) {
      isValid = true;
    }
  });

  return isValid;
};

export const isValidVideo = (uri: string): boolean => {
  let isValid = false;

  videoFormate.map((item) => {
    if (_.toLower(uri).includes(_.toLower(item))) {
      isValid = true;
    }
  });

  return isValid;
};

export const mediaCaching = async (uri: string): Promise<string> => {
  try {
    const basePath = uri.substring(0, uri.lastIndexOf("/"));

    const slugBase = _.kebabCase(basePath);

    const fileName = uri.substring(uri.lastIndexOf("/"));

    const finalSlug = slugBase + fileName;

    const slugName = _.replace(finalSlug, "/", "-");

    let pathName = FileSystem.cacheDirectory + slugName;

    try {
      const { exists } = await FileSystem.getInfoAsync(pathName);

      if (exists) {
        return pathName;
      } else {
        await FileSystem.downloadAsync(MEDIA_BASE_URL + uri, pathName, {
          cache: true,
        });
        return pathName;
      }
    } catch (err) {
      return MEDIA_BASE_URL + uri;
    }
  } catch (err) {
    return MEDIA_BASE_URL + uri;
  }
};
