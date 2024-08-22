import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = import.meta.env.VITE_AWS_REGION;
const ACCESS_KEY_ID = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
const BUCKET_NAME = import.meta.env.VITE_AWS_BUCKET_NAME;
const BASE_PATH = import.meta.env.VITE_AWS_BASE_PATH || "base_template_images";

// https://memetic.s3.us-east-2.amazonaws.com/
const BASE_URL = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/`;
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

export async function listImagesFromS3(): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: BASE_PATH + "/",
  });

  try {
    const response = await s3Client.send(command);
    const signedUrls = await Promise.all(
      (response.Contents || [])
        .filter((item) => item.Key && item.Key.match(/\.(jpg|jpeg|png|gif)$/i))
        .map(async (item) => {
          const getObjectCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: item.Key!,
          });
          return getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });
        }),
    );
    return signedUrls;
  } catch (err) {
    console.error("Error listing objects from S3:", err);
    return [];
  }
}

export async function deleteFromS3(url: string): Promise<void> {
  const key = extractObjectKeyFromUrl(url);
  if (!key) return;

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  console.log("[MemeGenerator] Deleting image", url, key);

  try {
    await s3Client.send(command);
  } catch (err) {
    console.error("Error deleting object from S3:", err);
  }
}

export async function uploadToS3(file: File): Promise<string | null> {
  const key = `${BASE_PATH}/${Date.now()}-${file.name}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: file.type,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });
    const response = await fetch(signedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (response.ok) {
      return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
    } else {
      console.error("Error uploading to S3:", response.statusText);
      return null;
    }
  } catch (err) {
    console.error("Error generating signed URL:", err);
    return null;
  }
}

export function extractObjectKeyFromUrl(url: string): string {
  const BASE_URL = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/`;

  // Remove query parameters
  const urlWithoutParams = url.split("?")[0];

  // Remove base URL
  const key = urlWithoutParams.replace(BASE_URL, "");

  return key;
}
