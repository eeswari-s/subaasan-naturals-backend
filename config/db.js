import mongoose from "mongoose";
import env from "./env.js";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

mongoose.connection.on("connected", () => {
  console.log(`[MongoDB] connected -> ${mongoose.connection.host}/${mongoose.connection.name}`);
});

mongoose.connection.on("error", (err) => {
  console.error(`[MongoDB] connection error: ${err.message}`);
});

mongoose.connection.on("disconnected", () => {
  console.warn("[MongoDB] disconnected");
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async (attempt = 1) => {
  if (!env.MONGODB_URI) {
    console.error("[MongoDB] MONGODB_URI is not defined in environment variables");
    process.exit(1);
  }

  try {
    await mongoose.connect(env.MONGODB_URI);
  } catch (error) {
    console.error(`[MongoDB] connection attempt ${attempt} failed: ${error.message}`);
    if (attempt >= MAX_RETRIES) {
      console.error("[MongoDB] max retries reached, exiting process");
      process.exit(1);
    }
    await wait(RETRY_DELAY_MS);
    return connectDB(attempt + 1);
  }
};

export default connectDB;
