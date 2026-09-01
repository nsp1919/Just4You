$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$assetDir = Join-Path $PSScriptRoot "reel-01-assets"
$outputPath = Join-Path $PSScriptRoot "reel-01-five-photos.mp4"
$narrationPath = Join-Path $assetDir "narration.wav"
$collagePath = Join-Path $assetDir "clean-00-collage.png"
$captionPath = (Join-Path $assetDir "reel-01-captions.ass").Replace("\", "/").Replace(":", "\:")
$musicPath = Join-Path $root "apps\birthday\public\music\t2.mp3"

$photoPaths = @(
    (Join-Path $root "apps\birthday\public\wedding-demo\couple.jpg"),
    (Join-Path $root "apps\birthday\public\wedding-demo\haldi.jpg"),
    (Join-Path $root "apps\birthday\public\wedding-demo\mehndi.jpg"),
    (Join-Path $root "apps\birthday\public\wedding-demo\sangeet.jpg")
)

$requiredPaths = @(
    $musicPath,
    (Join-Path $assetDir "clean-01-hero.png"),
    (Join-Path $assetDir "clean-02-letter.png"),
    (Join-Path $assetDir "clean-03-gallery.png"),
    (Join-Path $assetDir "clean-04-photo.png"),
    (Join-Path $assetDir "clean-05-finale.png"),
    (Join-Path $assetDir "clean-06-wishes.png"),
    (Join-Path $assetDir "reel-01-captions.ass")
) + $photoPaths

foreach ($requiredPath in $requiredPaths) {
    if (-not (Test-Path $requiredPath)) {
        throw "Required Reel asset is missing: $requiredPath"
    }
}

$collageFilter = @"
[0:v]split=2[basePhoto][centrePhoto];
[basePhoto]scale=210:280:force_original_aspect_ratio=increase,crop=210:280[p0];
[1:v]scale=210:280:force_original_aspect_ratio=increase,crop=210:280[p1];
[2:v]scale=210:280:force_original_aspect_ratio=increase,crop=210:280[p2];
[3:v]scale=210:280:force_original_aspect_ratio=increase,crop=210:280[p3];
[centrePhoto]scale=150:220:force_original_aspect_ratio=increase,crop=150:220[p4];
color=c=0xFCE7F0:s=450x633[bg];
[bg][p0]overlay=10:10[x1];
[x1][p1]overlay=230:10[x2];
[x2][p2]overlay=10:343[x3];
[x3][p3]overlay=230:343[x4];
[x4][p4]overlay=150:206,drawbox=x=144:y=200:w=162:h=232:color=white:t=6[out]
"@ -replace "`r?`n", ""

& ffmpeg -y -hide_banner -loglevel error `
    -i $photoPaths[0] -i $photoPaths[1] -i $photoPaths[2] -i $photoPaths[3] `
    -filter_complex $collageFilter -map "[out]" -frames:v 1 $collagePath
if ($LASTEXITCODE -ne 0) {
    throw "Unable to create the Reel opening collage."
}

$narration = @"
This is what five ordinary photos can become.

Instead of sending another photo collage, turn them into a personalised surprise website.

Add their name, your message, music and the celebration date. Then choose a theme that feels like them.

On their special day, send one private link. It opens with your photos, music, heartfelt words and wishes from everyone they love.

It starts at just 199 rupees with one year of hosting. Comment surprise and I will send you the live demo.
"@

$voice = New-Object -ComObject SAPI.SpVoice
$voice.Rate = 1
$voice.Volume = 100
$voiceTokens = $voice.GetVoices()
for ($index = 0; $index -lt $voiceTokens.Count; $index++) {
    $candidate = $voiceTokens.Item($index)
    if ($candidate.GetDescription() -like "*Zira*") {
        $voice.Voice = $candidate
        break
    }
}

$audioStream = New-Object -ComObject SAPI.SpFileStream
$audioStream.Open($narrationPath, 3, $false)
$voice.AudioOutputStream = $audioStream
[void]$voice.Speak($narration)
$audioStream.Close()

$scenePaths = @(
    $collagePath,
    (Join-Path $assetDir "clean-01-hero.png"),
    (Join-Path $assetDir "clean-02-letter.png"),
    (Join-Path $assetDir "clean-03-gallery.png"),
    (Join-Path $assetDir "clean-05-finale.png"),
    (Join-Path $assetDir "clean-06-wishes.png")
)

$sceneFilters = for ($index = 0; $index -lt $scenePaths.Count; $index++) {
    $crop = if ($index -eq 0) { "crop=450:633:0:0" } else { "crop=450:633:0:0" }
    "[$index`:v]$crop,scale=820:1154:flags=lanczos,pad=1080:1920:130:383:color=0x120B18,setsar=1,drawbox=x=109:y=362:w=862:h=1196:color=0xFFFFFF@0.16:t=3,fade=t=in:st=0:d=0.35,fade=t=out:st=5.65:d=0.35,setpts=PTS-STARTPTS[v$index]"
}

$concatInputs = (0..5 | ForEach-Object { "[v$_]" }) -join ""
$videoFilter = ($sceneFilters -join ";") + ";${concatInputs}concat=n=6:v=1:a=0[sequence];[sequence]ass='$captionPath'[video];[6:a]atempo=0.84,volume=1.0[narration];[7:a]volume=0.07,afade=t=out:st=35:d=1[music];[narration][music]amix=inputs=2:duration=longest:dropout_transition=2[audio]"

$ffmpegArguments = @("-y", "-hide_banner", "-loglevel", "error")
foreach ($scenePath in $scenePaths) {
    $ffmpegArguments += @("-loop", "1", "-t", "6", "-i", $scenePath)
}
$ffmpegArguments += @(
    "-i", $narrationPath,
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
    throw "FFmpeg failed to render Reel 01."
}

Write-Host "Rendered Reel: $outputPath"