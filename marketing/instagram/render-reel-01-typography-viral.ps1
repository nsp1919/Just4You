$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$assetDir = Join-Path $PSScriptRoot "reel-01-typography-assets"
$segmentDir = Join-Path $assetDir "viral-segments"
$sourceVoiceoverPath = Get-ChildItem (Join-Path $root "Voice over") -Filter "ElevenLabs_2026-09-03T10_26_19*.mp3" | Select-Object -First 1 -ExpandProperty FullName
$cutVoiceoverPath = Join-Path $assetDir "viral-voiceover.wav"
$musicPath = Join-Path $root "apps\birthday\public\music\t2.mp3"
$captionPath = (Join-Path $assetDir "typography-viral-tenglish.ass").Replace("\", "/").Replace(":", "\:")
$outputPath = Join-Path $PSScriptRoot "reel-01-typography-viral-cut.mp4"

New-Item -ItemType Directory -Force -Path $segmentDir | Out-Null

$cutFilter = @"
[0:a]atrim=start=8.75:end=10.74,asetpts=PTS-STARTPTS[a0];
[0:a]atrim=start=0:end=6.13,asetpts=PTS-STARTPTS[a1];
[0:a]atrim=start=18.31:end=31.98,asetpts=PTS-STARTPTS[a2];
[0:a]atrim=start=38.19:end=44.28,asetpts=PTS-STARTPTS[a3];
[0:a]atrim=start=44.50:end=47.94,asetpts=PTS-STARTPTS[a4];
[0:a]atrim=start=48.39:end=51.408938,asetpts=PTS-STARTPTS[a5];
[a0][a1][a2][a3][a4][a5]concat=n=6:v=0:a=1,aresample=48000[cut]
"@ -replace "`r?`n", ""

& ffmpeg -y -hide_banner -loglevel error -i $sourceVoiceoverPath -filter_complex $cutFilter -map "[cut]" -c:a pcm_s16le $cutVoiceoverPath
if ($LASTEXITCODE -ne 0) {
    throw "Unable to create the retention-cut voiceover."
}

$sceneIds = @(2, 1, 4, 5, 6, 8, 9, 10, 11, 2)
$sceneDurations = @(1.99, 6.13, 3.25, 3.90, 6.52, 3.43, 2.66, 3.44, 2.57, 0.45)

for ($index = 0; $index -lt $sceneIds.Count; $index++) {
    $sceneId = $sceneIds[$index]
    $duration = $sceneDurations[$index]
    $backgroundPath = Join-Path $assetDir ("background-{0:D2}.png" -f $sceneId)
    $cardPath = Join-Path $assetDir ("card-{0:D2}.png" -f $sceneId)
    $segmentPath = Join-Path $segmentDir ("segment-{0:D2}.mp4" -f ($index + 1))
    $cardOnLeft = (($sceneId - 1) % 2) -eq 0
    $baseX = if ($cardOnLeft) { 24 } else { 758 }
    $frequency = if ($index -eq 0) { 22 } elseif ($index -eq 7) { 6 } else { 2.8 }
    $amplitude = if ($index -eq 0) { 8 } else { 5 }
    $xMotion = "$baseX+$amplitude*sin(t*$frequency)"
    $yMotion = "898-14*abs(sin(t*$frequency))"
    $fadeIn = if ($index -eq 0) { "" } else { ",fade=t=in:st=0:d=0.15:color=black" }
    $fadeOutStart = [Math]::Max(0, [Math]::Round($duration - 0.15, 2))
    $fadeOut = if ($index -eq $sceneIds.Count - 1) { "" } else { ",fade=t=out:st=$fadeOutStart`:d=0.15:color=black" }
    $segmentFilter = "[0:v]scale=1128:2004:flags=lanczos,crop=1080:1920:x='24+8*sin(t*0.7)':y='42+5*cos(t*0.6)',fps=30,setsar=1[bg];[1:v]format=rgba,scale=250:300[card];[bg][card]overlay=x='$xMotion':y='$yMotion':eval=frame${fadeIn}${fadeOut}[video]"

    & ffmpeg -y -hide_banner -loglevel error -loop 1 -t $duration -i $backgroundPath -loop 1 -t $duration -i $cardPath -filter_complex $segmentFilter -map "[video]" -an -r 30 -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p $segmentPath
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to render animated typography segment $($index + 1)."
    }
}

$segmentPaths = 1..$sceneIds.Count | ForEach-Object {
    Join-Path $segmentDir ("segment-{0:D2}.mp4" -f $_)
}

$videoFilters = for ($index = 0; $index -lt $segmentPaths.Count; $index++) {
    "[$index`:v]setpts=PTS-STARTPTS[v$index]"
}
$concatInputs = (0..($segmentPaths.Count - 1) | ForEach-Object { "[v$_]" }) -join ""

$finalFilter = ($videoFilters -join ";") + ";${concatInputs}concat=n=10:v=1:a=0[sequence];[sequence]ass='$captionPath'[video];[10:a]highpass=f=70,lowpass=f=15000,loudnorm=I=-16:TP=-1.5:LRA=9,asplit=2[voice][sidechain];[11:a]volume=0.09,afade=t=in:st=0:d=0.5,afade=t=out:st=32.8:d=1.4[music];[music][sidechain]sidechaincompress=threshold=0.025:ratio=10:attack=18:release=360[ducked];[12:a]highpass=f=450,lowpass=f=5000,afade=t=out:st=0.04:d=0.30,volume=0.10[whoosh];[13:a]afade=t=out:st=0.03:d=0.13,volume=0.07,adelay=6710:all=1[pop];[14:a]afade=t=out:st=0.01:d=0.08,volume=0.045,adelay=11370:all=1[tick];[15:a]afade=t=out:st=0.04:d=0.24,volume=0.05,adelay=19050:all=1[chime];[16:a]lowpass=f=500,afade=t=out:st=0.03:d=0.27,volume=0.06,adelay=28930:all=1[impact];[voice][ducked][whoosh][pop][tick][chime][impact]amix=inputs=7:duration=first:normalize=0,volume=1.32[audio]"

$ffmpegArguments = @("-y", "-hide_banner", "-loglevel", "error")
foreach ($segmentPath in $segmentPaths) {
    $ffmpegArguments += @("-i", $segmentPath)
}
$ffmpegArguments += @(
    "-i", $cutVoiceoverPath,
    "-stream_loop", "-1", "-i", $musicPath,
    "-f", "lavfi", "-t", "0.35", "-i", "anoisesrc=color=pink:amplitude=0.18:sample_rate=48000",
    "-f", "lavfi", "-t", "0.16", "-i", "sine=frequency=720:sample_rate=48000",
    "-f", "lavfi", "-t", "0.09", "-i", "sine=frequency=1300:sample_rate=48000",
    "-f", "lavfi", "-t", "0.28", "-i", "sine=frequency=988:sample_rate=48000",
    "-f", "lavfi", "-t", "0.30", "-i", "sine=frequency=140:sample_rate=48000",
    "-filter_complex", $finalFilter,
    "-map", "[video]",
    "-map", "[audio]",
    "-t", "34.34",
    "-r", "30",
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-ar", "48000",
    "-ac", "2",
    "-movflags", "+faststart",
    $outputPath
)

& ffmpeg @ffmpegArguments
if ($LASTEXITCODE -ne 0) {
    throw "FFmpeg failed to render the retention-optimized typography Reel."
}

Write-Host "Rendered retention typography Reel: $outputPath"