import { drawRawImageDataOnCanvas } from "./utils";
import { ModelType, type ModelTypeKeys } from "./types";
import { prepareImageForModel } from "./imgConverter";

const canvas = document.getElementById(
  "segmentation-canvas"
) as HTMLCanvasElement;

async function segmentImageBodyPix(
  image: HTMLImageElement | ImageData
): Promise<void> {
  const bodyPixModule = await import("./models/bodyPix");
  const bodyPixResults = await bodyPixModule.segmentImageWithBodyPix(image); // This should now return an array
  if (bodyPixResults && bodyPixResults.length > 0) {
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;

    // Create a single combined mask for all people
    const combinedMaskCanvas = document.createElement("canvas");
    combinedMaskCanvas.width = bodyPixResults[0].width;
    combinedMaskCanvas.height = bodyPixResults[0].height;
    const combinedMaskCtx = combinedMaskCanvas.getContext("2d")!;
    const combinedMaskImageData = combinedMaskCtx.createImageData(
      combinedMaskCanvas.width,
      combinedMaskCanvas.height
    );

    // Initialize the combined mask data to all zeros (transparent)
    const combinedMaskData = new Uint8ClampedArray(
      combinedMaskCanvas.width * combinedMaskCanvas.height
    );

    // Loop through each person's segmentation result
    bodyPixResults.forEach((personResult) => {
      const personMaskData = personResult.data;
      // Add this person's mask to the combined mask
      for (let i = 0; i < personMaskData.length; i++) {
        // If this pixel is part of the person, set the combined mask value to 1
        if (personMaskData[i] > 0) {
          combinedMaskData[i] = 1;
        }
      }
    });

    // Populate the combined mask ImageData
    for (let i = 0; i < combinedMaskData.length; i++) {
      const value = combinedMaskData[i]; // 0 or 1
      const j = i * 4; // RGBA index
      const alpha = value > 0 ? 255 : 0;

      combinedMaskImageData.data[j] = 0; // R
      combinedMaskImageData.data[j + 1] = 0; // G
      combinedMaskImageData.data[j + 2] = 0; // B
      combinedMaskImageData.data[j + 3] = alpha; // A
    }

    combinedMaskCtx.putImageData(combinedMaskImageData, 0, 0);

    // Step 1: Draw the original image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (image instanceof HTMLImageElement) {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.putImageData(image, 0, 0);
    }

    // Step 2: Apply the combined mask
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(combinedMaskCanvas, 0, 0, canvas.width, canvas.height);

    // Reset for future use
    ctx.globalCompositeOperation = "source-over";
  }
}

async function segmentImageHuggingFace(image: Blob): Promise<void> {
  const huggingFaceModule = await import("./models/huggingFace");
  const res = await huggingFaceModule.segmentImageWithHuggingFace(image);
  if (res) {
    drawRawImageDataOnCanvas(res[0]);
  }
}

async function segmentImageMediapipe(image: HTMLImageElement): Promise<void> {
  const mediapipeModule = await import("./models/mediapipe");
  const res = await mediapipeModule.segmentImageWithMediapipe(image);
  if (!res || !res.categoryMask) {
    console.error("Segmentation result is invalid or missing categoryMask.");
    return;
  }

  const mask = res.categoryMask;
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    console.error("Could not get 2D rendering context from canvas.");
    return;
  }

  // Draw the original image onto the canvas.
  ctx.drawImage(image, 0, 0, image.width, image.height);

  // Get the pixel data from the original image on the canvas.
  // This is the data we will modify.
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data; // This is a Uint8ClampedArray for all pixels.

  // Get the segmentation mask data as a Float32Array
  const maskData = mask.getAsFloat32Array();

  // Iterate through the pixels of the mask and original image simultaneously.
  for (let i = 0; i < mask.height * mask.width; i++) {
    // Get the mask value for the current pixel.
    // 1.0 = person, 0.0 = background.
    const maskValue = maskData[i];

    // Invert the masking logic: check if the pixel is part of the person.
    if (maskValue === 1.0) {
      // If it's a person pixel, make it fully transparent (alpha = 0).
      // The pixel data array is structured as [R, G, B, A, R, G, B, A, ...]
      data[i * 4 + 3] = 0;
    }
    // If the maskValue is 0.0, the pixel is background, and we do nothing.
    // The alpha channel for that pixel remains as it was in the original image (presumably 255).
  }

  // Put the modified pixel data back onto the canvas.
  ctx.putImageData(imageData, 0, 0);

  // Return the canvas, which now contains the cropped image.
}

async function getModelFunction(
  modelType: ModelTypeKeys
): Promise<(img: any) => Promise<any>> {
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
  image: HTMLImageElement,
  { model = ModelType.Mediapipe }: { model: ModelTypeKeys } = {
    model: ModelType.Mediapipe,
  }
): Promise<void> {
  const segmenter = await getModelFunction(model);
  const processedImage = await prepareImageForModel(image, model);
  document.getElementById("header")!.innerText = `Using model: ${model}`;
  if (!segmenter) {
    console.error(`No segmentation function found for model: ${model}`);
    return;
  }
  await segmenter(processedImage);
}
