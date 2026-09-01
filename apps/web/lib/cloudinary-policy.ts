export type UploadPurpose =
  | "celebrationPhoto"
  | "celebrationMusic"
  | "voiceMessage"
  | "videoMessage"
  | "weddingPoster"
  | "weddingRevealMusic"
  | "contributionPhoto"
  | "contributionVoice"
  | "verifiedReviewImage"
  | "verifiedReviewVideo";

export interface UploadPolicy {
  resourceType: "image" | "video";
  folder: string;
  maxBytes: number;
  mimeTypes: readonly string[];
  formats: readonly string[];
  collaborationOnly?: boolean;
  adminOnly?: boolean;
}

export const UPLOAD_POLICIES: Record<UploadPurpose, UploadPolicy> = {
  celebrationPhoto: {
    resourceType: "image", folder: "birthdayglow/photos", maxBytes: 8 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"], formats: ["jpg", "jpeg", "png", "webp"],
  },
  celebrationMusic: {
    resourceType: "video", folder: "birthdayglow/music", maxBytes: 20 * 1024 * 1024,
    mimeTypes: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/webm", "audio/mp4", "audio/ogg", "audio/aac"],
    formats: ["mp3", "wav", "webm", "m4a", "mp4", "ogg", "aac"],
  },
  voiceMessage: {
    resourceType: "video", folder: "birthdayglow/voice", maxBytes: 15 * 1024 * 1024,
    mimeTypes: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/webm", "audio/mp4", "audio/ogg", "audio/aac"],
    formats: ["mp3", "wav", "webm", "m4a", "mp4", "ogg", "aac"],
  },
  videoMessage: {
    resourceType: "video", folder: "birthdayglow/video", maxBytes: 60 * 1024 * 1024,
    mimeTypes: ["video/mp4", "video/webm", "video/quicktime"], formats: ["mp4", "webm", "mov"],
  },
  weddingPoster: {
    resourceType: "image", folder: "birthdayglow/wedding/posters", maxBytes: 8 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"], formats: ["jpg", "jpeg", "png", "webp"],
  },
  weddingRevealMusic: {
    resourceType: "video", folder: "birthdayglow/wedding/reveal-music", maxBytes: 20 * 1024 * 1024,
    mimeTypes: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/webm", "audio/mp4", "audio/ogg", "audio/aac"],
    formats: ["mp3", "wav", "webm", "m4a", "mp4", "ogg", "aac"],
  },
  contributionPhoto: {
    resourceType: "image", folder: "birthdayglow/contributions", maxBytes: 8 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"], formats: ["jpg", "jpeg", "png", "webp"], collaborationOnly: true,
  },
  contributionVoice: {
    resourceType: "video", folder: "birthdayglow/contributions", maxBytes: 15 * 1024 * 1024,
    mimeTypes: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/webm", "audio/mp4", "audio/ogg", "audio/aac"],
    formats: ["mp3", "wav", "webm", "m4a", "mp4", "ogg", "aac"], collaborationOnly: true,
  },
  verifiedReviewImage: {
    resourceType: "image", folder: "birthdayglow/verified-reviews", maxBytes: 8 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"], formats: ["jpg", "jpeg", "png", "webp"], adminOnly: true,
  },
  verifiedReviewVideo: {
    resourceType: "video", folder: "birthdayglow/verified-reviews", maxBytes: 30 * 1024 * 1024,
    mimeTypes: ["video/mp4", "video/webm", "video/quicktime"], formats: ["mp4", "webm", "mov"], adminOnly: true,
  },
};

export function uploadPolicyFor(value: unknown): UploadPolicy | null {
  return typeof value === "string" && value in UPLOAD_POLICIES
    ? UPLOAD_POLICIES[value as UploadPurpose]
    : null;
}

export function validateUploadFile(file: { type: string; size: number }, purpose: UploadPurpose): string | null {
  const policy = UPLOAD_POLICIES[purpose];
  if (!policy.mimeTypes.includes(file.type.toLowerCase())) return "This file type is not supported.";
  if (!Number.isFinite(file.size) || file.size <= 0) return "Choose a non-empty file.";
  if (file.size > policy.maxBytes) return `Choose a file smaller than ${Math.floor(policy.maxBytes / 1024 / 1024)} MB.`;
  return null;
}

export function isAllowedCloudinaryUrl(value: string, purpose: UploadPurpose, cloudName: string): boolean {
  const policy = UPLOAD_POLICIES[purpose];
  try {
    const url = new URL(value);
    const extension = url.pathname.split(".").pop()?.toLowerCase() ?? "";
    const uploadPrefix = `/${cloudName}/${policy.resourceType}/upload/`;
    const uploadPath = url.pathname.startsWith(uploadPrefix)
      ? url.pathname.slice(uploadPrefix.length).replace(/^v\d+\//, "")
      : "";
    return url.protocol === "https:"
      && url.hostname === "res.cloudinary.com"
      && uploadPath.startsWith(`${policy.folder}/`)
      && policy.formats.includes(extension);
  } catch {
    return false;
  }
}

export function isValidCloudinaryUploadResult(
  result: unknown,
  purpose: UploadPurpose,
  cloudName: string,
): result is { secure_url: string; bytes: number; format: string; resource_type: string } {
  if (!result || typeof result !== "object") return false;
  const value = result as Record<string, unknown>;
  const policy = UPLOAD_POLICIES[purpose];
  if (typeof value.secure_url !== "string" || typeof value.bytes !== "number" || typeof value.format !== "string") return false;
  try {
    return isAllowedCloudinaryUrl(value.secure_url, purpose, cloudName)
      && value.resource_type === policy.resourceType
      && value.bytes <= policy.maxBytes
      && policy.formats.includes(value.format.toLowerCase());
  } catch {
    return false;
  }
}