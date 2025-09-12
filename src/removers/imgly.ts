import { removeBackground } from "@imgly/background-removal";

export const removeBackgroundWithImgly = (
  image_src:
    | ImageData
    | ArrayBuffer
    | Uint8Array
    | Blob
    | URL
    | string
    | HTMLImageElement
) => removeBackground(image_src);
