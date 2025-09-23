import type {
  AllowedImageTypes,
  ConversionDecision,
  ConversionTarget,
  ModelTypeKeys,
} from "./types";
import { ModelType } from "./types";
import { isValidImageDataUrl } from "./utils";

// Define supported types for each model
export const MODEL_SUPPORTED_TYPES: Record<ModelTypeKeys, string[]> = {
  HuggingFace: ["Blob"], // dataurl, imageData , image element => blob
  Mediapipe: ["HTMLImageElement", "ImageData"], // dataurl,blob => HTMLImageElement
  BodyPix: ["HTMLImageElement", "ImageData"], // dataurl,blob, bitmap => HTMLImageElement
};

function getImageDataType(imageData: AllowedImageTypes): string {
  if (imageData instanceof ImageData) return "ImageData";
  if (imageData instanceof HTMLImageElement) return "HTMLImageElement";
  if (imageData instanceof ImageBitmap) return "ImageBitmap";
  if (imageData instanceof Blob) return "Blob";
  console.log(
    typeof imageData,
    "****************************************************************"
  );
  if (typeof imageData === "string") return "string";

  throw new Error(`Unsupported image data type: ${typeof imageData}`);
}

function decideOptimalImageConversion(
  imageData: AllowedImageTypes,
  selectedModel: ModelTypeKeys
): ConversionDecision {
  const inputType = getImageDataType(imageData);
  const supportedTypes = MODEL_SUPPORTED_TYPES[selectedModel];

  // Check if input type is already supported
  if (supportedTypes.includes(inputType)) {
    return {
      conversionNeeded: false,
      reason: `Input type '${inputType}' is already supported by ${selectedModel} model`,
    };
  }

  // Choose optimal target based on input type and model requirements
  let targetType: ConversionTarget;

  switch (selectedModel) {
    case ModelType.HuggingFace:
      // huggingface only supports Blob
      targetType = "Blob";
      break;

    case ModelType.Mediapipe:
      targetType = "HTMLImageElement";
      break;

    case ModelType.BodyPix:
      targetType = "HTMLImageElement";
      break;

    default:
      throw new Error(`Unsupported model: ${selectedModel}`);
  }

  return {
    conversionNeeded: true,
    targetType,
    reason: `Input type '${inputType}' needs conversion to '${targetType}' for optimal ${selectedModel} model performance`,
  };
}

const ImageConverter = {
  async htmlImageToBlob(
    img: HTMLImageElement,
    mimeType: string = "image/png",
    quality?: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to convert image to blob"));
          }
        },
        mimeType,
        quality
      );
    });
  },

  async imageDataToBlob(
    imageData: ImageData,
    mimeType: string = "image/png",
    quality?: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      canvas.width = imageData.width;
      canvas.height = imageData.height;

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to convert ImageData to blob"));
          }
        },
        mimeType,
        quality
      );
    });
  },

  async blobToHtmlImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image from blob"));
      };

      img.src = url;
    });
  },

  async dataUrlToHtmlImage(dataUrl: string): Promise<HTMLImageElement> {
    if (!isValidImageDataUrl(dataUrl)) {
      throw new Error("Invalid data URL");
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error("Failed to load image from data URL"));
      img.src = dataUrl;
    });
  },
  async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    if (!isValidImageDataUrl(dataUrl)) {
      throw new Error("Invalid data URL");
    }
    const response = await fetch(dataUrl);
    return await response.blob();
  },
};

async function convertImage(
  imageData: AllowedImageTypes,
  targetType: ConversionTarget,
  options?: { mimeType?: string; quality?: number }
): Promise<AllowedImageTypes> {
  const inputType = getImageDataType(imageData);
  if (inputType === targetType) {
    return imageData;
  }
  const { mimeType = "image/png", quality } = options || {};
  // Define conversion paths
  if (inputType === "HTMLImageElement" && targetType === "Blob") {
    return ImageConverter.htmlImageToBlob(
      imageData as HTMLImageElement,
      mimeType,
      quality
    );
  } else if (inputType === "ImageData" && targetType === "Blob") {
    return ImageConverter.imageDataToBlob(
      imageData as ImageData,
      mimeType,
      quality
    );
  } else if (inputType === "Blob" && targetType === "HTMLImageElement") {
    return ImageConverter.blobToHtmlImage(imageData as Blob);
  } else if (inputType === "string" && targetType === "HTMLImageElement") {
    return ImageConverter.dataUrlToHtmlImage(imageData as string);
  } else if (inputType === "string" && targetType === "Blob") {
    return ImageConverter.dataUrlToBlob(imageData as string);
  } else {
    throw new Error(
      `Conversion from ${inputType} to ${targetType} is not implemented`
    );
  }
}

export const prepareImageForModel = async (
  imageData: AllowedImageTypes,
  model: ModelTypeKeys,
  options?: { mimeType?: string; quality?: number }
): Promise<AllowedImageTypes> => {
  const decision = decideOptimalImageConversion(imageData, model);

  if (!decision.conversionNeeded) {
    return imageData;
  }

  // Perform the conversion
  return await convertImage(imageData, decision.targetType!, options);
};
