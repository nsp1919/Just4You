$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$assetDir = Join-Path $PSScriptRoot "reel-01-assets"
$outputPath = Join-Path $PSScriptRoot "reel-01-no-voiceover.mp4"
$captionPath = (Join-Path $assetDir "reel-01-silent-captions.ass").Replace("\", "/").Replace(":", "\:")
$musicPath = Join-Path $root "apps\birthday\public\music\t2.mp3"

$scenePaths = @(
    (Join-Path $assetDir "clean-01-hero.png"),
    (Join-Path $assetDir "clean-02-letter.png"),
    (Join-Path $assetDir "clean-03-gallery.png"),
    (Join-Path $assetDir "clean-04-photo.png"),
    (Join-Path $assetDir "clean-05-finale.png"),
    (Join-Path $assetDir "clean-06-wishes.png")
)

$requiredPaths = @($musicPath, (Join-Path $assetDir "reel-01-silent-captions.ass")) + $scenePaths
foreach ($requiredPath in $requiredPaths) {
    if (-not (Test-Path $requiredPath)) {
        throw "Required Reel asset is missing: $requiredPath"
    }
}

$sceneFilters = for ($index = 0; $index -lt $scenePaths.Count; $index++) {
    "[$index`:v]crop=450:633:0:0,scale=820:1154:flags=lanczos,pad=1080:1920:130:383:color=0x120B18,setsar=1,drawbox=x=109:y=362:w=862:h=1196:color=0xFFFFFF@0.16:t=3,fade=t=in:st=0:d=0.35,fade=t=out:st=5.65:d=0.35,setpts=PTS-STARTPTS[v$index]"
}

$concatInputs = (0..5 | ForEach-Object { "[v$_]" }) -join ""
$videoFilter = ($sceneFilters -join ";") + ";${concatInputs}concat=n=6:v=1:a=0[sequence];[sequence]ass='$captionPath'[video];[6:a]volume=0.12,afade=t=in:st=0:d=0.6,afade=t=out:st=34.5:d=1.5[audio]"

$ffmpegArguments = @("-y", "-hide_banner", "-loglevel", "error")
foreach ($scenePath in $scenePaths) {
    $ffmpegArguments += @("-loop", "1", "-t", "6", "-i", $scenePath)
}
$ffmpegArguments += @(
    "-stream_loop", "-1", "-i", $musicPath,
    "-filter_complex", $videoFilter,
    "-map", "[video]",
    "-map", "[audio]",
    "-t", "36",
    "-r", "30",
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-movflags", "+faststart",
    $outputPath
)

& ffmpeg @ffmpegArguments
if ($LASTEXITCODE -ne 0) {
    throw "FFmpeg failed to render the voiceover-free Reel 01."
}

Write-Host "Rendered voiceover-free Reel: $outputPath"