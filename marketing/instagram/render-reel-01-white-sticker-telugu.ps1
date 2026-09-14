$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$assetDir = Join-Path $PSScriptRoot "reel-01-white-sticker-assets"
$voiceoverPath = Get-ChildItem (Join-Path $root "Voice over") -Filter "ElevenLabs_2026-09-03T10_26_19*.mp3" | Select-Object -First 1 -ExpandProperty FullName
$musicPath = Join-Path $root "apps\birthday\public\music\t2.mp3"
$captionPath = (Join-Path $assetDir "telugu-captions.ass").Replace("\", "/").Replace(":", "\:")
$outputPath = Join-Path $PSScriptRoot "reel-01-white-sticker-telugu.mp4"

$sceneDurations = @(6.14, 5.24, 6.96, 7.12, 6.52, 6.03, 3.38, 3.11, 3.69, 3.22)
$scenePaths = 1..10 | ForEach-Object {
    Join-Path $assetDir ("scene-{0:D2}.png" -f $_)
}

$requiredPaths = $scenePaths + @($voiceoverPath, $musicPath, (Join-Path $assetDir "telugu-captions.ass"))
foreach ($requiredPath in $requiredPaths) {
    if (-not $requiredPath -or -not (Test-Path $requiredPath)) {
        throw "Required white sticker Reel asset is missing: $requiredPath"
    }
}

$sceneFilters = for ($index = 0; $index -lt $scenePaths.Count; $index++) {
    $duration = $sceneDurations[$index]
    $fadeOut = [Math]::Round($duration - 0.32, 2)
    $xMotion = if ($index % 2 -eq 0) {
        "40+18*sin(t*0.75)"
    } else {
        "40-18*sin(t*0.75)"
    }
    $yMotion = if ($index % 3 -eq 0) {
        "71+12*cos(t*0.65)"
    } else {
        "71-12*cos(t*0.65)"
    }

    "[$index`:v]scale=1160:2062:flags=lanczos,crop=1080:1920:x='$xMotion':y='$yMotion',fps=30,setsar=1,fade=t=in:st=0:d=0.32:color=white,fade=t=out:st=$fadeOut`:d=0.32:color=white,setpts=PTS-STARTPTS[v$index]"
}

$concatInputs = (0..9 | ForEach-Object { "[v$_]" }) -join ""
$filter = ($sceneFilters -join ";") + ";${concatInputs}concat=n=10:v=1:a=0[sequence];[sequence]ass='$captionPath'[video];[10:a]highpass=f=70,lowpass=f=15000,loudnorm=I=-16:TP=-1.5:LRA=9,asplit=2[voice][sidechain];[11:a]volume=0.10,afade=t=in:st=0:d=0.8,afade=t=out:st=50:d=1.4[music];[music][sidechain]sidechaincompress=threshold=0.025:ratio=10:attack=18:release=360[ducked];[voice][ducked]amix=inputs=2:duration=first:weights='1 0.34':normalize=0,volume=1.4[audio]"

$ffmpegArguments = @("-y", "-hide_banner", "-loglevel", "error")
for ($index = 0; $index -lt $scenePaths.Count; $index++) {
    $ffmpegArguments += @("-loop", "1", "-t", $sceneDurations[$index], "-i", $scenePaths[$index])
}
$ffmpegArguments += @(
    "-i", $voiceoverPath,
    "-stream_loop", "-1", "-i", $musicPath,
    "-filter_complex", $filter,
    "-map", "[video]",
    "-map", "[audio]",
    "-t", "51.41",
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
    throw "FFmpeg failed to render the Telugu white sticker Reel."
}

Write-Host "Rendered Telugu white sticker Reel: $outputPath"