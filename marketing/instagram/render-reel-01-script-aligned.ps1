$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$assetDir = Join-Path $PSScriptRoot "reel-01-assets"
$outputPath = Join-Path $PSScriptRoot "reel-01-script-aligned-no-voiceover.mp4"
$captionPath = (Join-Path $assetDir "reel-01-script-aligned.ass").Replace("\", "/").Replace(":", "\:")
$musicPath = Join-Path $root "apps\birthday\public\music\t2.mp3"
$videoMessagePath = Join-Path $root "apps\birthday\public\demo-media\video-message.mp4"
$sangeetPath = Join-Path $root "apps\birthday\public\wedding-demo\sangeet.jpg"

$heroPath = Join-Path $assetDir "clean-01-hero.png"
$collagePath = Join-Path $assetDir "clean-00-collage.png"
$letterPath = Join-Path $assetDir "clean-02-letter.png"
$wishesPath = Join-Path $assetDir "clean-06-wishes.png"
$finalePath = Join-Path $assetDir "clean-05-finale.png"

$requiredPaths = @(
    $musicPath,
    $videoMessagePath,
    $sangeetPath,
    $heroPath,
    $collagePath,
    $letterPath,
    $wishesPath,
    $finalePath,
    (Join-Path $assetDir "reel-01-script-aligned.ass")
)

foreach ($requiredPath in $requiredPaths) {
    if (-not (Test-Path $requiredPath)) {
        throw "Required Reel asset is missing: $requiredPath"
    }
}

$productFrame = "scale=820:1154:force_original_aspect_ratio=increase,crop=820:1154,pad=1080:1920:130:383:color=0x120B18,setsar=1,drawbox=x=109:y=362:w=862:h=1196:color=0xFFFFFF@0.16:t=3"
$filter = @"
[0:v]drawbox=x=240:y=760:w=600:h=420:color=0xE98AAF:t=fill,drawbox=x=200:y=680:w=680:h=110:color=0xF6B6CC:t=fill,drawbox=x=495:y=680:w=90:h=500:color=0xF3C969:t=fill,drawbox=x=240:y=890:w=600:h=80:color=0xF3C969:t=fill,drawbox=x=405:y=580:w=130:h=110:color=0xD71E68:t=fill,drawbox=x=545:y=580:w=130:h=110:color=0xD71E68:t=fill,fade=t=out:st=2.8:d=1.0,setsar=1,setpts=PTS-STARTPTS[v0];
[1:v]$productFrame,fade=t=in:st=0:d=0.35,fade=t=out:st=5.65:d=0.35,setpts=PTS-STARTPTS[v1];
[2:v]$productFrame,fade=t=in:st=0:d=0.35,fade=t=out:st=3.65:d=0.35,setpts=PTS-STARTPTS[v2];
[3:v]$productFrame,drawbox=x=300:y=1190:w=480:h=170:color=0x120B18@0.84:t=fill:enable='lt(t,2)',drawbox=x=350:y=1250:w=28:h=50:color=0xF3C969:t=fill:enable='lt(t,2)',drawbox=x=405:y=1220:w=28:h=110:color=0xE98AAF:t=fill:enable='lt(t,2)',drawbox=x=460:y=1240:w=28:h=70:color=0xF3C969:t=fill:enable='lt(t,2)',drawbox=x=515:y=1205:w=28:h=140:color=0xE98AAF:t=fill:enable='lt(t,2)',drawbox=x=570:y=1235:w=28:h=80:color=0xF3C969:t=fill:enable='lt(t,2)',drawbox=x=625:y=1215:w=28:h=120:color=0xE98AAF:t=fill:enable='lt(t,2)',drawbox=x=680:y=1250:w=28:h=50:color=0xF3C969:t=fill:enable='lt(t,2)',fade=t=in:st=0:d=0.35,fade=t=out:st=3.65:d=0.35,setpts=PTS-STARTPTS[v3];
[4:v]drawbox=x=125:y=650:w=830:h=470:color=0x2A172C:t=fill,drawbox=x=145:y=670:w=790:h=430:color=0xFFFFFF@0.08:t=3,drawbox=x=185:y=815:w=190:h=140:color=0xD71E68@0.45:t=fill,drawbox=x=445:y=815:w=190:h=140:color=0xD71E68@0.45:t=fill,drawbox=x=705:y=815:w=190:h=140:color=0xD71E68@0.45:t=fill,fade=t=in:st=0:d=0.25,fade=t=out:st=3.65:d=0.35,setsar=1,setpts=PTS-STARTPTS[v4];
[5:v]$productFrame,fade=t=in:st=0:d=0.35,fade=t=out:st=4.65:d=0.35,setpts=PTS-STARTPTS[v5];
[6:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fade=t=in:st=0:d=0.35,fade=t=out:st=3.65:d=0.35,setpts=PTS-STARTPTS[v6];
[7:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fade=t=in:st=0:d=0.35,fade=t=out:st=3.65:d=0.35,setpts=PTS-STARTPTS[v7];
[8:v]$productFrame,fade=t=in:st=0:d=0.35,fade=t=out:st=5.65:d=0.35,setpts=PTS-STARTPTS[v8];
[9:v]drawbox=x=100:y=340:w=880:h=1240:color=0xFFFFFF@0.05:t=3,drawbox=x=150:y=730:w=780:h=460:color=0xD71E68@0.16:t=fill,fade=t=in:st=0:d=0.35,setsar=1,setpts=PTS-STARTPTS[v9];
[v0][v1][v2][v3][v4][v5][v6][v7][v8][v9]concat=n=10:v=1:a=0[sequence];
[sequence]ass='$captionPath'[video];
[10:a]volume=0.12,afade=t=in:st=0:d=0.6,afade=t=out:st=43.5:d=1.5[audio]
"@ -replace "`r?`n", ""

$ffmpegArguments = @(
    "-y", "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-t", "4", "-i", "color=c=0x160E1D:s=1080x1920:r=30",
    "-loop", "1", "-t", "6", "-i", $heroPath,
    "-loop", "1", "-t", "4", "-i", $collagePath,
    "-loop", "1", "-t", "4", "-i", $letterPath,
    "-f", "lavfi", "-t", "4", "-i", "color=c=0x160E1D:s=1080x1920:r=30",
    "-loop", "1", "-t", "5", "-i", $wishesPath,
    "-t", "4", "-i", $videoMessagePath,
    "-loop", "1", "-t", "4", "-i", $sangeetPath,
    "-loop", "1", "-t", "6", "-i", $finalePath,
    "-f", "lavfi", "-t", "4", "-i", "color=c=0x160E1D:s=1080x1920:r=30",
    "-stream_loop", "-1", "-i", $musicPath,
    "-filter_complex", $filter,
    "-map", "[video]",
    "-map", "[audio]",
    "-t", "45",
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
    throw "FFmpeg failed to render the script-aligned Reel 01."
}

Write-Host "Rendered script-aligned Reel: $outputPath"