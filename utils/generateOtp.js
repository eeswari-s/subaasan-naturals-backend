import crypto from "crypto";

const generateOtp = (length = 6) => {
  const max = 10 ** length;
  const otp = crypto.randomInt(0, max).toString().padStart(length, "0");
  return otp;
};

export default generateOtp;
