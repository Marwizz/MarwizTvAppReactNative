export interface IGetDeviceInfo {
  id: string;
  mediaUrl: string[];
  endTime: string;
  startTime: string;
  duration: string;
}

export interface IDeviceResposne {
  isOk: boolean;
  message: string;
  sqs_url: string;
  base_URL: string;
  AWS_ACCESS_KEY: string;
  AWS_SECRET_KEY: string;
  ESP32_IP: string;
}
