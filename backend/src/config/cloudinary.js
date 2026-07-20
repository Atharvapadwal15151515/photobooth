import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const requiredVariables = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`${variable} is missing from the .env file`);
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const testCloudinaryConnection = async () => {
  try {
    await cloudinary.api.ping();
    console.log("Cloudinary connection successful");
  } catch (error) {
    console.error("Cloudinary connection failed:", error.message);
    throw error;
  }
};

export default cloudinary;