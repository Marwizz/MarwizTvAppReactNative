import { SQSClient } from "@aws-sdk/client-sqs";
import * as Device from "expo-device";
import { Dimensions } from "react-native";

export const BASE_API_URL = process.env.EXPO_PUBLIC_BASE_API_URL;

export const BASE_WEBSOCKET_URI = "ws://192.168.1.59:81";

export const CREATE_WIZZ_ID = BASE_API_URL + "/api/create-wizz-id";

export const WIZZ_ID = BASE_API_URL + "/api/auth/get-device";

export const GET_DEVICE_ID = BASE_API_URL + "/api/get-device-id";

export const CHECK_WIZZ_ID_API = BASE_API_URL + "/api/get-isvalid-status";

export const SQS_BASE_URI = "https://sqs.ap-south-1.amazonaws.com";

export const MEDIA_URL =
  BASE_API_URL + "/api/auth/stakeholder/media/today-publish-medias-by-device";

export const MEDIA_BASE_URL = "https://marwiz.blob.core.windows.net/videos/";

export const THANK_YOU_URI =
  "https://images.unsplash.com/photo-1549032305-e816fabf0dd2?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

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

export const deviceName =
  Device.deviceName || Device.productName || Device.modelName;
