import cloudinary from "../config/cloudinary.js";
import compressImage from "./imageCompress.js";

export const uploadBufferToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `ecommerce/${folder}`, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });

export const uploadImage = async (fileBuffer, folder) => {
  const compressed = await compressImage(fileBuffer);
  return uploadBufferToCloudinary(compressed, folder);
};

export const uploadImages = async (fileBuffers = [], folder) =>
  Promise.all(fileBuffers.map((buffer) => uploadImage(buffer, folder)));

export const deleteImage = async (publicId) => {
  if (!publicId) return null;
  return cloudinary.uploader.destroy(publicId);
};

export const deleteImages = async (publicIds = []) =>
  Promise.all(publicIds.filter(Boolean).map((id) => deleteImage(id)));
