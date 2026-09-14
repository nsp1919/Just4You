$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$assetDir = Join-Path $PSScriptRoot "reel-01-assets"
$outputPath = Join-Path $PSScriptRoot "reel-01-ai-generated-no-voiceover.mp4"
$captionPath = (Join-Path $assetDir "reel-01-ai-generated.ass").Replace("\", "/").Replace(":", "\:")
$musicPath = Join-Path $root "apps\birthday\public\music\t2.mp3"

$clipPaths = @(
    (Join-Path $assetDir "ai-01-forgotten-gift.mp4"),
    (Join-Path $assetDir "ai-02-digital-surprise-reaction.mp4"),
    (Join-Path $assetDir "ai-03-occasion-montage.mp4"),
    (Join-Path $assetDir "ai-04-heartfelt-embrace.mp4")
)

$requiredPaths = $clipPaths + @($musicPath, (Join-Path $assetDir "reel-01-ai-generated.ass"))
foreach ($requiredPath in $requiredPaths) {
    if (-not (Test-Path $requiredPath)) {
        throw "Required generated Reel asset is missing: $requiredPath"
    }
}

$filter = @"
[0:v]trim=duration=8,setpts=PTS-STARTPTS,scale=1080:1920:flags=lanczos,fps=30,setsar=1[v0];
[1:v]trim=duration=6,setpts=1.333333*(PTS-STARTPTS),scale=1080:1920:flags=lanczos,fps=30,setsar=1[v1];
[2:v]trim=duration=6,setpts=1.333333*(PTS-STARTPTS),scale=1080:1920:flags=lanczos,fps=30,setsar=1[v2];
[3:v]trim=duration=6,setpts=1.333333*(PTS-STARTPTS),scale=1080:1920:flags=lanczos,fps=30,setsar=1,tpad=stop_mode=clone:stop_duration=6[v3];
[v0][v1][v2][v3]concat=n=4:v=1:a=0[sequence];
[sequence]ass='$captionPath'[video];
[4:a]volume=0.12,afade=t=in:st=0:d=0.6,afade=t=out:st=36.5:d=1.5[audio]
"@ -replace "`r?`n", ""

$ffmpegArguments = @("-y", "-hide_banner", "-loglevel", "error")
foreach ($clipPath in $clipPaths) {
    $ffmpegArguments += @("-i", $clipPath)
}
$ffmpegArguments += @(
    "-stream_loop", "-1", "-i", $musicPath,
    "-filter_complex", $filter,
    "-map", "[video]",
    "-map", "[audio]",
    "-t", "38",
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
    throw "FFmpeg failed to render the fully generated Reel 01."
}

Write-Host "Rendered fully generated Reel: $outputPath"