import { SQSClient } from "@aws-sdk/client-sqs";
import { Dimensions } from "react-native";

export const BASE_API_URL = process.env.EXPO_PUBLIC_BASE_API_URL;

export const CREATE_WIZZ_ID = BASE_API_URL + "/api/create-wizz-id";

export const WIZZ_ID = BASE_API_URL + "/api/auth/get-device";

export const GET_DEVICE_ID = BASE_API_URL + "/api/get-device-id";

export const CHECK_WIZZ_ID_API = BASE_API_URL + "/api/get-isvalid-status";

export const MEDIA_URL =
  BASE_API_URL + "/api/auth/stakeholder/media/today-publish-medias-by-device";

export const MEDIA_BASE_URL = "https://marwiz.blob.core.windows.net/videos/";

export const SQS_CLIENT = new SQSClient({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.EXPO_PUBLIC_ACCESS_KEY_ID! as string,
    secretAccessKey: process.env.EXPO_PUBLIC_SECRET_ACCESS_KEY as string,
  },
});

export const { height: screenHeight, width: screenWidth } =
  Dimensions.get("screen");

export const imgFormate = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".tiff",
  ".webp",
  ".heif",
  ".raw",
  ".svg",
  ".ico",
  ".avif",
];

export const videoFormate = [
  ".mp4",
  ".avi",
  ".mov",
  ".mkv",
  ".webm",
  ".flv",
  ".wmv",
  ".mpeg",
  ".mpg",
  ".3gp",
  ".ogv",
  ".avchd",
];
