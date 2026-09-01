"use client";

import { auth } from "@/lib/firebase";
import {
  isValidCloudinaryUploadResult,
  UPLOAD_POLICIES,
  validateUploadFile,
  type UploadPurpose,
} from "@/lib/cloudinary-policy";

interface CollaborationAuthorization {
  celebrationId: string;
  token: string;
}

interface SignatureResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
  resourceType: "image" | "video";
}

export async function uploadCloudinaryFile(
  file: File,
  purpose: UploadPurpose,
  collaboration?: CollaborationAuthorization,
): Promise<string> {
  const validationError = validateUploadFile(file, purpose);
  if (validationError) throw new Error(validationError);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!collaboration) {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("Sign in again before uploading media.");
    headers.Authorization = `Bearer ${token}`;
  }

  const signatureResponse = await fetch("/api/media/sign", {
    method: "POST",
    headers,
    body: JSON.stringify({ purpose, collaboration }),
  });
  const signature = await signatureResponse.json() as SignatureResponse & { error?: string };
  if (!signatureResponse.ok) throw new Error(signature.error ?? "Unable to authorize this upload.");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder);
  formData.append("allowed_formats", signature.allowedFormats);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.resourceType}/upload`,
    { method: "POST", body: formData },
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message ?? "Media upload failed.");
  if (!isValidCloudinaryUploadResult(result, purpose, signature.cloudName)) {
    throw new Error("Cloudinary returned an unexpected media file.");
  }
  return result.secure_url;
}