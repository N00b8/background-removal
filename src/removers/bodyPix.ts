import {
  load,
  BodyPix,
  type PersonSegmentation,
} from "@tensorflow-models/body-pix";
import "@tensorflow/tfjs";

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
  image: HTMLImageElement
): Promise<PersonSegmentation[] | undefined> {
  if (!bodyPixNet) {
    console.error("BodyPix model is not loaded.");
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
      segmentationThreshold: 0.7,
      maxDetections: 4,
      scoreThreshold: 0.2,
      nmsRadius: 20,
      minKeypointScore: 0.3,
      refineSteps: 10,
    });
    console.log("Multi-person segmentation result:", bodyPixResult);
    return bodyPixResult;
  } catch (error) {
    console.error("Error during image segmentation:", error);
  }
}
// Initialize the segmenter when the script loads
createImageSegmenter();
