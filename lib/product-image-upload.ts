import * as ImageManipulator from "expo-image-manipulator";
import { Platform } from "react-native";
import type { ImagePickerAsset } from "expo-image-picker";

const MAX_PRODUCT_IMAGE_DIMENSION = 1920;
const PRODUCT_IMAGE_COMPRESSION = 0.75;

export type PreparedProductImage = {
  base64: string;
  mimeType: "image/jpeg";
  fileName: string;
};

/**
 * Returns a downscale action only when the source image exceeds the maximum
 * supported upload dimension. Keeping the aspect ratio prevents distortion.
 */
export function getProductImageResizeActions(
  width: number,
  height: number,
): ImageManipulator.Action[] {
  if (width <= 0 || height <= 0) return [];

  if (width >= height && width > MAX_PRODUCT_IMAGE_DIMENSION) {
    return [{ resize: { width: MAX_PRODUCT_IMAGE_DIMENSION } }];
  }

  if (height > width && height > MAX_PRODUCT_IMAGE_DIMENSION) {
    return [{ resize: { height: MAX_PRODUCT_IMAGE_DIMENSION } }];
  }

  return [];
}

/**
 * Converts an image selected from the device to a consistently sized JPEG
 * before it is encoded into the tRPC upload payload. This avoids sending a
 * full-resolution camera file as base64 and also converts iPhone HEIC images
 * to the JPEG format accepted by the upload API.
 */
export async function prepareProductImageForUpload(
  asset: ImagePickerAsset,
): Promise<PreparedProductImage> {
  const sourceUri =
    Platform.OS === "web" && asset.base64
      ? `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`
      : asset.uri;

  const resizeActions = getProductImageResizeActions(asset.width, asset.height);
  const result = await ImageManipulator.manipulateAsync(
    sourceUri,
    resizeActions,
    {
      base64: true,
      compress: PRODUCT_IMAGE_COMPRESSION,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  if (!result.base64) {
    throw new Error("사진을 업로드용으로 변환하지 못했습니다.");
  }

  return {
    base64: result.base64,
    mimeType: "image/jpeg",
    fileName: `product-${Date.now()}.jpg`,
  };
}
