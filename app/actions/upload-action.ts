"use server";

import cloudinary from "@/lib/cloudinary";

export async function getCloudinarySignature() {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
    },
    process.env.CLOUDINARY_API_SECRET!
  );

  return { timestamp, signature, apiKey: process.env.CLOUDINARY_API_KEY };
}
