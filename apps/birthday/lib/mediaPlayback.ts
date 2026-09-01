const activeForegroundMedia = new Set<string>();
let backgroundMusicToResume: HTMLAudioElement | null = null;

export function setForegroundMediaPlaying(mediaId: string, isPlaying: boolean): void {
  if (isPlaying) {
    activeForegroundMedia.add(mediaId);

    const backgroundMusic = document.querySelector<HTMLAudioElement>("audio[data-background-music]");
    if (backgroundMusic && !backgroundMusic.paused && !backgroundMusicToResume) {
      backgroundMusicToResume = backgroundMusic;
      backgroundMusic.pause();
    }
    return;
  }

  activeForegroundMedia.delete(mediaId);
  if (activeForegroundMedia.size > 0 || !backgroundMusicToResume) return;

  const backgroundMusic = backgroundMusicToResume;
  backgroundMusicToResume = null;
  if (backgroundMusic.isConnected && backgroundMusic.paused) {
    void backgroundMusic.play().catch(() => {});
  }
}