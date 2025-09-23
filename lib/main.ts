import { drawRawImageDataOnCanvas } from "./utils";
import {
  ModelType,
  type AllowedImageTypes,
  type HuggingFaceRawImage,
  type ModelTypeKeys,
} from "./types";
import { prepareImageForModel } from "./imgConverter";
import { drawOnCanvas, returnPng } from "./models/bodyPix";
import { mediapipeResultToPng } from "./models/mediapipe";

async function segmentImageBodyPix(
  image: HTMLImageElement | ImageData,
  canvasId?: string
): Promise<void | string> {
  const bodyPixModule = await import("./models/bodyPix");
  const bodyPixResults = await bodyPixModule.segmentImageWithBodyPix(image); // This should now return an array

  if (!bodyPixResults || bodyPixResults.length === 0) {
    console.error("No body segmentation results returned.");
    return;
  }

  if (canvasId) {
    drawOnCanvas(bodyPixResults, image, canvasId);
  } else {
    const png = await returnPng(bodyPixResults, image);
    return png;
  }
}

async function segmentImageHuggingFace(
  image: Blob,
  canvasId?: string
): Promise<undefined | string> {
  const huggingFaceModule = await import("./models/huggingFace");
  const res: HuggingFaceRawImage[] =
    await huggingFaceModule.segmentImageWithHuggingFace(image);
  if (!res || res.length === 0) {
    console.error("No HuggingFace segmentation results returned.");
    return;
  }
  // Step 1: Create a new ImageData object using the raw data.
  if (canvasId) {
    const imageData = new ImageData(
      res[0].data as any,
      res[0].width,
      res[0].height
    );
    drawRawImageDataOnCanvas(imageData, canvasId);
  } else {
    const blob = res[0].toBlob("image/png");
    const url = URL.createObjectURL(await blob);
    return url;
  }
}

async function segmentImageMediapipe(
  image: HTMLImageElement,
  canvasId?: string
): Promise<undefined | string> {
  const mediapipeModule = await import("./models/mediapipe");
  const res = await mediapipeModule.segmentImageWithMediapipe(image);
  if (!res || !res.categoryMask) {
    console.error("Segmentation result is invalid or missing categoryMask.");
    return;
  }

  if (canvasId) {
    const mask = res.categoryMask;
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    canvas.width = image.width;
    canvas.height = image.height;
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
  } else {
    const png = await mediapipeResultToPng(res, image);
    return png;
  }
}

async function getModelFunction(
  modelType: ModelTypeKeys
): Promise<(img: any, canvasId?: string) => Promise<any>> {
  switch (modelType) {
    case ModelType.BodyPix:
      return segmentImageBodyPix;
    case ModelType.HuggingFace:
      return segmentImageHuggingFace;
    case ModelType.Mediapipe:
      return segmentImageMediapipe;
    default:
      throw new Error(`Invalid model type: ${modelType}`);
  }
}

export async function segmentImage(
  image: AllowedImageTypes,
  {
    model = ModelType.BodyPix,
    canvasId,
  }: { model: ModelTypeKeys; canvasId?: string } = {
    model: ModelType.BodyPix,
  }
): Promise<void | string> {
  const segmenter = await getModelFunction(model);
  const processedImage = await prepareImageForModel(image, model);
  if (!segmenter) {
    console.error(`No segmentation function found for model: ${model}`);
    return;
  }
  const res = await segmenter(processedImage, canvasId);
  if (res) return res;
}

export { ModelType } from "./types";
