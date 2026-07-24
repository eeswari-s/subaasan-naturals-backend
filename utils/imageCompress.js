import sharp from "sharp";

const MAX_DIMENSION = 1200;
const QUALITY = 80;

const compressImage = async (buffer) => {
  const compressed = await sharp(buffer)
    .rotate()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: QUALITY })
    .toBuffer();

  return compressed;
};

export default compressImage;
