export async function imageElementToBlob(
  imageElement,
  mimeType = "image/png",
  quality = 1.0
) {
  return new Promise((resolve, reject) => {
    // Step 1: Create a temporary canvas element.
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Failed to get 2D context from canvas."));
      return;
    }

    // Set the canvas dimensions to match the image element's natural dimensions.
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;

    // Step 2: Draw the image onto the canvas.
    ctx.drawImage(imageElement, 0, 0);

    // Step 3: Use the toBlob() method to create a Blob object.
    // The callback function is executed once the Blob is created.
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create Blob from canvas."));
        }
      },
      mimeType,
      quality
    );
  });
}

export function drawRawImageDataOnCanvas(
  imageDataObject,
  canvasId = "segmentation-canvas"
) {
  // Get the canvas element from the DOM.
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!canvas) {
    console.error("Canvas element not found!");
    return;
  }

  // Get the 2D rendering context.
  const ctx = canvas.getContext("2d");

  // Make sure the canvas and context are available.
  if (!canvas || !ctx) {
    console.error("Canvas or 2D context not found!");
    return;
  }

  // Adjust canvas dimensions to match the image data.
  canvas.width = imageDataObject.width;
  canvas.height = imageDataObject.height;

  // Step 1: Create a new ImageData object using the raw data.
  const imageData = new ImageData(
    imageDataObject.data,
    imageDataObject.width,
    imageDataObject.height
  );

  // Step 2: Use putImageData() to draw the pixels on the canvas.
  ctx.putImageData(imageData, 0, 0);
  console.log("Successfully drew raw image data on the canvas.");
}

export async function drawBlobToCanvas(
  blob: Blob,
  canvasId = "segmentation-canvas"
) {
  // Get the canvas element from the DOM.
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;

  // Get the 2D rendering context.
  const ctx = canvas.getContext("2d");

  // Ensure the canvas and context are available.
  if (!canvas || !ctx) {
    console.error("Canvas or 2D context not found!");
    return;
  }

  try {
    // Step 1: Create an ImageBitmap from the Blob.
    // This is more efficient for drawing than using an Image object.
    const imageBitmap = await createImageBitmap(blob);
    console.log("Created ImageBitmap from Blob:", imageBitmap);
    // Step 2: Adjust canvas dimensions to match the image.
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;

    // Step 3: Use drawImage() to render the ImageBitmap on the canvas.
    ctx.drawImage(imageBitmap, 0, 0);

    console.log("Successfully drew image from Blob on the canvas.");
  } catch (error) {
    console.error("Failed to create ImageBitmap or draw to canvas:", error);
  }
}
