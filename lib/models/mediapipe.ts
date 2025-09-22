import {
  ImageSegmenter,
  FilesetResolver,
  ImageSegmenterResult,
  MPMask,
} from "@mediapipe/tasks-vision";
import { blobToDataURL } from "../utils";

let imageSegmenter: ImageSegmenter | undefined;

// Create the ImageSegmenter instance.
async function createImageSegmenter() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
  );
  imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-assets/selfie_segmentation.tflite",
    },
    runningMode: "IMAGE",
    outputCategoryMask: true,
    outputConfidenceMasks: false,
  });
  console.log("Image Segmenter loaded successfully!");
}

createImageSegmenter();

export async function segmentImageWithMediapipe(
  image: HTMLImageElement | ImageBitmap | ImageData
): Promise<ImageSegmenterResult | undefined> {
  if (!imageSegmenter) {
    await createImageSegmenter();
    if (!imageSegmenter) {
      throw new Error("Model not loaded");
    }
  }

  try {
    const result = imageSegmenter.segment(image);
    return result;
  } catch (error) {
    console.error("Error processing the image:", error);
  }
}

export async function mediapipeResultToPng(
  result: ImageSegmenterResult,
  image: HTMLImageElement
): Promise<string | undefined> {
  const mask = result.categoryMask as MPMask;
  const canvas = new OffscreenCanvas(image.width, image.height);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("Could not get 2D rendering context from canvas.");
    return;
  }
  ctx.drawImage(image, 0, 0, image.width, image.height);

  // Get the pixel data from the original image on the canvas.
  // This is the data we will modify.
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data; // This is a Uint8ClampedArray for all pixels.

  // Get the segmentation mask data as a Float32Array
  const maskData = mask.getAsFloat32Array();

  // Iterate through the pixels of the mask and original image simultaneously.
  for (let i = 0; i < mask.height * mask.width; i++) {
    const maskValue = maskData[i];
    if (maskValue === 1.0) {
      data[i * 4 + 3] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  const blob = await canvas.convertToBlob({ type: "image/png" });
  const url = await blobToDataURL(blob);
  return url;
}
