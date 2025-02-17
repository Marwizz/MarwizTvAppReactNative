import { imgFormate, videoFormate } from "@/constants";
import { toLower } from "lodash";

export const isValidImage = (uri: string): boolean => {
  let isValid = false;

  imgFormate.map((item) => {
    if (toLower(uri).includes(toLower(item))) {
      isValid = true;
    }
  });

  return isValid;
};

export const isValidVideo = (uri: string): boolean => {
  let isValid = false;

  videoFormate.map((item) => {
    if (toLower(uri).includes(toLower(item))) {
      isValid = true;
    }
  });

  return isValid;
};
