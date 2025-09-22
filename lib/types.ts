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

export interface HuggingFaceRawImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  channels: number;

  // Derived props
  readonly size: [number, number];

  // Transformations
  clone(): HuggingFaceRawImage;
  grayscale(): HuggingFaceRawImage;
  rgb(): HuggingFaceRawImage;
  rgba(): HuggingFaceRawImage;
  putAlpha(alpha: number | Uint8Array): HuggingFaceRawImage;

  // Async transforms
  resize(
    width: number,
    height: number,
    options?: { resample?: number }
  ): Promise<HuggingFaceRawImage>;
  crop(box: [number, number, number, number]): Promise<HuggingFaceRawImage>;
  pad(paddings: [number, number, number, number]): Promise<HuggingFaceRawImage>;
  center_crop(size: [number, number]): Promise<HuggingFaceRawImage>;
  convert(type: string): Promise<HuggingFaceRawImage>;

  // Exporters
  toCanvas(): HTMLCanvasElement;
  toBlob(type?: string, quality?: number): Promise<Blob>;
  toTensor(layout?: "CHW" | "HWC"): any;
  toSharp(): any; // Node.js only
  save(path: string): Promise<void>;

  // Channel utilities
  split(): HuggingFaceRawImage[];
}
