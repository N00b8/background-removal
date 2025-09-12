import { pipeline } from "@huggingface/transformers";
import { imageElementToBlob } from "../utils";

let removerPipeline: undefined | any;
// Load the model when the script loads
async function loadModel() {
  if (removerPipeline) return; // already loaded
  try {
    // Use a model from the Hugging Face Hub specifically for background removal.
    // The 'image-segmentation' task is what we need.
    removerPipeline = await pipeline(
      "background-removal",
      "onnx-community/ormbg-ONNX"
    );
  } catch (error) {
    console.error("Failed to load the model:", error);
  }
}

export async function segmentImageWithHuggingFace(
  image: HTMLImageElement
): Promise<any> {
  // This function is a placeholder to match the expected interface.
  // The actual segmentation is handled in the event listener below.
  if (!removerPipeline) {
    await loadModel();
    if (!removerPipeline) {
      throw new Error("Model not loaded");
    }
  }

  try {
    const blob = await imageElementToBlob(image, "image/png");
    const result = await removerPipeline(blob);
    return result;
  } catch (error) {
    console.error("Error processing the image:", error);
  }
}

// Start the process by loading the model
loadModel();
