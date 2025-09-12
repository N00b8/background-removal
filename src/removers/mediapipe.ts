import { ImageSegmenter, FilesetResolver } from "@mediapipe/tasks-vision";

let imageSegmenter;

// Load the model
// async function createImageSegmenter() {
//   const vision = await FilesetResolver.forVisionTasks(
//     "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
//   );
//   imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
//     baseOptions: {
//       modelAssetPath:
//         "https://storage.googleapis.com/mediapipe-assets/deeplabv3.tflite",
//     },
//     outputCategoryMask: true,
//     outputConfidenceMasks: false,
//     runningMode: "IMAGE",
//   });
// }

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
    outputCategoryMask: true,
  });
  console.log("Image Segmenter loaded successfully!");
}

createImageSegmenter();

export async function segmentImageWithMediapipe(
  image: HTMLImageElement
): Promise<any> {
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
