# Remove BG Browser

🚀 Fast and simple background remover which leverages the latest innovations in in-browser machine learning to use opensource models to remove background from images


## Features
AI-Powered Background Removal: Leverages state-of-the-art models like hugging face's onnx-community/ormbg-ONNX, Googles mediapipe selfie segmentation and BodyPix 2 by tensorflow.js. Although the name says "browser" you can use it in node.js as well as it doesnt rely on any broswer apis

## Installation
```
npm install remove-bg-broswer
# or
yarn add remove-bg-broswer
```

## Usage
```import { segmentImage } from "remove-bg-browser";
const res = await segmentImage(img)
```
where image can be either HTMLImageElement, Blob, Base64 image data url or ImageData


By default the the package uses BodyPix2 but you can select a model like:
```import { segmentImage, ModelType } from "remove-bg-browser";
const res = await segmentImage(img, {
          model: ModelType.BodyPix,
        });
```
you can optionally pass a canvas Id(browsers only) and our package will draw the segmented image on that canvas. If nothing is provided it will return a base64 encoded string data url



## License
MIT (Assuming you will add an MIT license file)

## Request features
This is a relatively new package and we would love to add any features multiple people find helpful so please feel free to ask for any features you think would be useful
