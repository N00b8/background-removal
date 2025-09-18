export const ModelType = {
  BodyPix: "BodyPix",
  HuggingFace: "HuggingFace",
  Mediapipe: "Mediapipe",
} as const;

// Define a type from the object for type-checking
export type ModelTypeKeys = (typeof ModelType)[keyof typeof ModelType];

export type AllowedImageTypes =
  | ImageData
  | Blob
  | string //dataUrl
  | HTMLImageElement;

export type ConversionTarget =
  | "HTMLImageElement"
  | "ImageData"
  | "ImageBitmap"
  | "Blob";

export interface ConversionDecision {
  conversionNeeded: boolean;
  targetType?: ConversionTarget;
  reason?: string;
}
