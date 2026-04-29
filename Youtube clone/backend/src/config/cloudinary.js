import { v2 as cloudinary } from "cloudinary";

const isCloudinaryEnabled = process.env.ENABLE_CLOUDINARY === "true";

if (isCloudinaryEnabled) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

export { cloudinary, isCloudinaryEnabled };
