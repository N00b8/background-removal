import { segmentImageWithBodyPix } from "./removers/bodyPix";
import { segmentImageWithHuggingFace } from "./removers/huggingFace";
import { removeBackgroundWithImgly } from "./removers/imgly";
import { segmentImageWithMediapipe } from "./removers/mediapipe";
import { imageElementToBlob } from "./utils";

const imageUpload = document.getElementById("image-upload") as HTMLInputElement;
const canvas = document.getElementById(
  "segmentation-canvas"
) as HTMLCanvasElement;

async function segmentImageBodyPix(image: HTMLImageElement): Promise<void> {
  const bodyPixResults = await segmentImageWithBodyPix(image); // This should now return an array
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
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Step 2: Apply the combined mask
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(combinedMaskCanvas, 0, 0, canvas.width, canvas.height);

    // Reset for future use
    ctx.globalCompositeOperation = "source-over";
  }
}

async function segmentImageHuggingFace(image: HTMLImageElement): Promise<void> {
  const res = await segmentImageWithHuggingFace(image);
  if (res) {
    drawRawImageDataOnCanvas(res[0]);
  }
}

async function segmentImageMediapipe(image) {
  // Check for the segmentImageWithMediapipe function, assuming it's available and returns a segmentation result.
  if (typeof segmentImageWithMediapipe !== "function") {
    console.error("The function 'segmentImageWithMediapipe' is not defined.");
    return;
  }

  const res = await segmentImageWithMediapipe(image);
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
  return canvas;
}

async function segmentImgly(image: HTMLImageElement): Promise<void> {
  const blob = (await imageElementToBlob(image, "image/png")) as Blob;
  const res = await removeBackgroundWithImgly(blob);
  drawBlobToCanvas(res);
  console.log(res);
}

// Event listener for the file input
imageUpload.addEventListener("change", (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file: File | undefined = target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      const img = new Image();
      img.onload = async () => {
        // await segmentImgly(img);
        // await segmentImageBodyPix(img);
        // await segmentImageHuggingFace(img);
        await segmentImageMediapipe(img);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
});
function drawBlobToCanvas(res: Blob) {
  throw new Error("Function not implemented.");
}
