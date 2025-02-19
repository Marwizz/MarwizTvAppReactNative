import { MEDIA_BASE_URL } from "@/constants";
import * as FileSystem from "expo-file-system";
import _ from "lodash";

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
