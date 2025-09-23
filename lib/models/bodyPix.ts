import {
  load,
  BodyPix,
  type PersonSegmentation,
} from "@tensorflow-models/body-pix";
import "@tensorflow/tfjs";
import { blobToDataURL } from "../utils";

let bodyPixNet: BodyPix | undefined;

// Load the image segmenter model
async function createImageSegmenter(): Promise<void> {
  if (bodyPixNet) return; // already loaded
  try {
    bodyPixNet = await load({
      architecture: "ResNet50",
      outputStride: 16,
      quantBytes: 2,
    });

    console.log("Image Segmenter loaded.");
  } catch (error) {
    console.error("Failed to load the Image Segmenter:", error);
  }
}

export async function segmentImageWithBodyPix(
  image: HTMLImageElement | ImageData
): Promise<PersonSegmentation[] | undefined> {
  if (!bodyPixNet) {
    await createImageSegmenter();
    if (!bodyPixNet) {
      console.error("BodyPix model not loaded yet.");
      return;
    }
  }

  try {
    if (!bodyPixNet) {
      console.error("Image Segmenter not loaded yet.");
      return;
    }

    const bodyPixResult = await bodyPixNet.segmentMultiPerson(image, {
      flipHorizontal: false,
      internalResolution: "full",
      segmentationThreshold: 0.8,
      maxDetections: 4,
      scoreThreshold: 0.2,
      nmsRadius: 20,
      minKeypointScore: 0.3,
      refineSteps: 10,
    });
    return bodyPixResult;
  } catch (error) {
    console.error("Error during image segmentation:", error);
  }
}
// Initialize the segmenter when the script loads

function createMaskFromSegmentations(segs: PersonSegmentation[]): ImageData {
  if (segs.length === 0) throw new Error("No segmentations provided");

  const width = segs[0].width;
  const height = segs[0].height;
  const maskImageData = new ImageData(width, height);

  // Loop over each pixel
  for (let i = 0; i < width * height; i++) {
    let isPerson = false;

    // Check all segmentations for this pixel
    for (const seg of segs) {
      if (seg.data[i] === 1) {
        isPerson = true;
        break; // No need to check further
      }
    }

    const j = i * 4;

    if (isPerson) {
      // Person → opaque white
      maskImageData.data[j] = 255;
      maskImageData.data[j + 1] = 255;
      maskImageData.data[j + 2] = 255;
      maskImageData.data[j + 3] = 255;
    } else {
      // Background → transparent
      maskImageData.data[j] = 0;
      maskImageData.data[j + 1] = 0;
      maskImageData.data[j + 2] = 0;
      maskImageData.data[j + 3] = 0;
    }
  }

  return maskImageData;
}

function maskToCanvas(mask: ImageData): OffscreenCanvas {
  const maskCanvas = new OffscreenCanvas(mask.width, mask.height);

  const ctx = maskCanvas.getContext("2d")!;
  ctx.putImageData(mask, 0, 0);

  return maskCanvas;
}

function drawImageWithMask(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  maskCanvas: OffscreenCanvas
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Draw image
  ctx.drawImage(image, 0, 0, ctx.canvas.width, ctx.canvas.height);

  // Apply mask (keep only overlapping parts)
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(maskCanvas, 0, 0, ctx.canvas.width, ctx.canvas.height);

  // Reset composite mode
  ctx.globalCompositeOperation = "source-over";
}

export const drawOnCanvas = (
  bodyPixResults: PersonSegmentation[],
  image: HTMLImageElement | ImageData,
  canvasId: string
) => {
  const WIDTH = image.width;
  const HEIGHT = image.height;
  const maskImageData = createMaskFromSegmentations(bodyPixResults!);
  const maskCanvas = maskToCanvas(maskImageData);
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!canvas) {
    throw new Error(`Canvas with id ${canvasId} not found`);
  }
  const ctx = canvas.getContext("2d")!;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  drawImageWithMask(ctx, image as HTMLImageElement, maskCanvas);
};

export const returnPng = async (
  bodyPixResults: PersonSegmentation[],
  image: HTMLImageElement | ImageData
) => {
  const WIDTH =
    image instanceof HTMLImageElement ? image.naturalWidth : image.width;
  const HEIGHT =
    image instanceof HTMLImageElement ? image.naturalHeight : image.height;
  const maskImageData = createMaskFromSegmentations(bodyPixResults);
  const maskCanvas = maskToCanvas(maskImageData);
  const offscreenCanvas = new OffscreenCanvas(WIDTH, HEIGHT);
  const offscreenCtx = offscreenCanvas.getContext("2d")!;
  if (image instanceof HTMLImageElement) {
    offscreenCtx.drawImage(image, 0, 0, WIDTH, HEIGHT);
  } else {
    offscreenCtx.putImageData(image, 0, 0);
  }

  // Apply mask (keep only overlapping parts)
  offscreenCtx.globalCompositeOperation = "destination-in";
  offscreenCtx.drawImage(
    maskCanvas,
    0,
    0,
    offscreenCanvas.width,
    offscreenCanvas.height
  );
  // Reset for future use
  offscreenCtx.globalCompositeOperation = "source-over";
  const blob = await offscreenCanvas.convertToBlob({ type: "image/png" });
  const url = await blobToDataURL(blob);
  return url;
};
