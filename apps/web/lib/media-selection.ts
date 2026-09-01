export function resolveBackgroundMusicType(musicData: unknown): "none" | "preset" | "upload" {
  const value = musicData as { musicType?: unknown; musicUploadUrl?: unknown; musicPresetId?: unknown } | null;
  if (value && ["none", "preset", "upload"].includes(String(value.musicType))) {
    return value.musicType as "none" | "preset" | "upload";
  }
  if (value?.musicUploadUrl) return "upload";
  if (value?.musicPresetId) return "preset";
  return "none";
}
