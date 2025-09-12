import {
  FilesetResolver,
  ImageSegmenter,
  ImageSegmenterResult,
} from "@mediapipe/tasks-vision";

const runningMode = "IMAGE";
let imageSegmenter: ImageSegmenter | null = null;

async function createImageSegmenter() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-assets/selfie_segmenter.tflite",
    },
    outputCategoryMask: true,
    outputConfidenceMasks: false,
    runningMode: runningMode, // "IMAGE", "VIDEO", or "LIVE_STREAM"
  });
}
createImageSegmenter();

export async function segmentImageWithMediapipe(
  image: HTMLImageElement
): Promise<ImageSegmenterResult | undefined> {
  if (!imageSegmenter) {
    console.error("Mediapipe Image Segmenter is not loaded.");
    await createImageSegmenter();
    if (!imageSegmenter) {
      console.error("Mediapipe Image Segmenter not loaded yet.");
      return;
    }
  }

  try {
    const res = imageSegmenter.segment(image);
    return res;
  } catch (error) {
    console.error("Error during image segmentation:", error);
  }
}

createImageSegmenter();
