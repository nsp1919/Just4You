"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Camera, Check, Loader2, RotateCcw, Send, Square, Video } from "lucide-react";

type Stage = "loading" | "intro" | "camera" | "preview" | "sending" | "sent" | "unavailable";

const MAX_RECORDING_SECONDS = 30;
const END_FRAME_MS = 2000;

function drawCover(context: CanvasRenderingContext2D, video: HTMLVideoElement, width: number, height: number) {
  const sourceWidth = video.videoWidth || width;
  const sourceHeight = video.videoHeight || height;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  context.drawImage(video, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawWatermark(context: CanvasRenderingContext2D, width: number, height: number) {
  context.save();
  context.fillStyle = "rgba(12, 8, 18, 0.68)";
  context.beginPath();
  context.roundRect(width - 250, height - 86, 214, 48, 18);
  context.fill();
  context.font = "700 23px sans-serif";
  context.fillStyle = "#fff5ec";
  context.textAlign = "center";
  context.fillText("Just4You.buzz", width - 143, height - 54);
  context.restore();
}

function drawEndingFrame(context: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#18101e");
  gradient.addColorStop(0.52, "#32152c");
  gradient.addColorStop(1, "#7a253f");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.textAlign = "center";
  context.fillStyle = "#ffcf7a";
  context.font = "700 30px sans-serif";
  context.fillText("A MOMENT MADE WITH", width / 2, height / 2 - 105);
  context.fillStyle = "#fff5ec";
  context.font = "700 64px Georgia, serif";
  context.fillText("Just4You.buzz", width / 2, height / 2);
  context.fillStyle = "#e8cbd5";
  context.font = "400 26px sans-serif";
  context.fillText("Create a surprise they will never forget", width / 2, height / 2 + 68);
}

export default function ReactionRecorderPage() {
  const { id } = useParams<{ id: string }>();
  const [stage, setStage] = useState<Stage>("loading");
  const [recipientName, setRecipientName] = useState("your loved one");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState("");
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const outputStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endingRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/reaction-recordings/${id}`)
      .then(async (request) => {
        const result = await request.json();
        if (!request.ok) throw new Error(result.error ?? "This reaction link is unavailable.");
        setRecipientName(result.recipientName || "your loved one");
        setStage(localStorage.getItem(`reaction_sent_${id}`) ? "sent" : "intro");
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "This reaction link is unavailable.");
        setStage("unavailable");
      });
  }, [id]);

  useEffect(() => () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    outputStreamRef.current?.getTracks().forEach((track) => track.stop());
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const openCamera = async () => {
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new Error("Video recording is not supported in this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      cameraStreamRef.current = stream;
      setStage("camera");
      requestAnimationFrame(() => {
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          void cameraVideoRef.current.play();
        }
      });
    } catch (cameraError) {
      setError(cameraError instanceof Error ? cameraError.message : "Camera access was unavailable.");
    }
  };

  const finishRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording" || endingRef.current) return;
    endingRef.current = true;
    setRecording(false);
    setFinalizing(true);
    cameraStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = false; });
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    autoStopRef.current = setTimeout(() => recorder.stop(), END_FRAME_MS);
  };

  const startRecording = () => {
    const sourceVideo = cameraVideoRef.current;
    const sourceStream = cameraStreamRef.current;
    const canvas = canvasRef.current;
    if (!sourceVideo || !sourceStream || !canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;
    canvas.width = 720;
    canvas.height = 1280;
    endingRef.current = false;
    chunksRef.current = [];
    setSeconds(0);

    const draw = () => {
      if (endingRef.current) {
        drawEndingFrame(context, canvas.width, canvas.height);
      } else {
        drawCover(context, sourceVideo, canvas.width, canvas.height);
        drawWatermark(context, canvas.width, canvas.height);
      }
      animationRef.current = requestAnimationFrame(draw);
    };
    draw();

    const canvasStream = canvas.captureStream(30);
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...sourceStream.getAudioTracks(),
    ]);
    outputStreamRef.current = combinedStream;
    const mimeTypes = ["video/mp4;codecs=h264,aac", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
    const mimeType = mimeTypes.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
    const recorder = new MediaRecorder(combinedStream, mimeType ? { mimeType, videoBitsPerSecond: 3_000_000 } : undefined);
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
    recorder.onstop = () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoBlob(blob);
      setPreviewUrl(url);
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      outputStreamRef.current?.getTracks().forEach((track) => track.stop());
      setRecording(false);
      setFinalizing(false);
      setStage("preview");
    };
    recorder.start(500);
    setRecording(true);
    timerRef.current = setInterval(() => setSeconds((value) => value + 1), 1000);
    autoStopRef.current = setTimeout(finishRecording, MAX_RECORDING_SECONDS * 1000);
  };

  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setVideoBlob(null);
    setConsent(false);
    void openCamera();
  };

  const sendReaction = async () => {
    if (!videoBlob || !consent) return;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_VIDEO_PRESET || process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      setError("Reaction uploads are not configured yet.");
      return;
    }

    setStage("sending");
    setError("");
    try {
      const extension = videoBlob.type.includes("mp4") ? "mp4" : "webm";
      const formData = new FormData();
      formData.append("file", new File([videoBlob], `reaction.${extension}`, { type: videoBlob.type }));
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "birthdayglow/reactions");
      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, { method: "POST", body: formData });
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok || !uploadResult.secure_url) throw new Error(uploadResult.error?.message ?? "Video upload failed.");

      const saveResponse = await fetch(`/api/reaction-recordings/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, videoUrl: uploadResult.secure_url, consentToShare: true }),
      });
      const saveResult = await saveResponse.json();
      if (!saveResponse.ok) throw new Error(saveResult.error ?? "Unable to send your reaction.");
      localStorage.setItem(`reaction_sent_${id}`, "1");
      setStage("sent");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send your reaction.");
      setStage("preview");
    }
  };

  if (stage === "loading") return <main className="grid min-h-screen place-items-center bg-[#100a16] text-white"><Loader2 className="animate-spin text-[#ff9e4f]" size={34} /></main>;
  if (stage === "unavailable") return <MessageState icon="🔒" title="Reaction unavailable" message={error} />;
  if (stage === "sent") return <MessageState icon="💛" title="Your reaction was sent" message={`The person who made ${recipientName}'s surprise can now watch your private reaction.`} />;

  return (
    <main className="min-h-screen bg-[#100a16] px-5 py-10 text-white sm:py-14">
      <div className="mx-auto max-w-xl">
        <header className="mb-7 text-center">
          <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[#ff8a5c] to-[#ff5f93] shadow-[0_12px_35px_rgba(255,95,147,0.25)]"><Video size={22} /></div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ffb877]">Keep the moment</p>
          <h1 className="font-playfair text-4xl font-bold leading-tight">Record your reaction</h1>
          <p className="mt-3 leading-7 text-white/55">Send the person who made {recipientName}&apos;s surprise the moment you saw it.</p>
        </header>

        {stage === "intro" && (
          <section className="border-y border-white/10 py-9 text-center">
            <Camera size={32} className="mx-auto mb-4 text-[#ff9e4f]" />
            <h2 className="font-playfair text-2xl font-semibold">A 30-second video is enough</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/45">Your browser will ask for camera and microphone access. Nothing uploads until you preview it and consent.</p>
            <button type="button" onClick={openCamera} className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-lg bg-gradient-to-r from-[#ff8a5c] to-[#ff5f93] px-6 font-bold"><Camera size={17} /> Open camera</button>
          </section>
        )}

        {stage === "camera" && (
          <section>
            <div className="relative mx-auto aspect-[9/16] max-h-[65vh] overflow-hidden rounded-lg bg-black">
              <video ref={cameraVideoRef} muted playsInline className="h-full w-full scale-x-[-1] object-cover" />
              <div className="absolute bottom-4 right-4 rounded-full bg-black/55 px-3 py-1.5 text-xs font-bold text-white/80 backdrop-blur">Just4You.buzz</div>
              {(recording || finalizing) && <div className="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-xs font-bold">{finalizing ? "ADDING END FRAME" : `REC · ${Math.min(seconds, MAX_RECORDING_SECONDS)}s`}</div>}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="mt-5 flex justify-center">
              {finalizing
                ? <button type="button" disabled className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-white/15 px-6 font-bold text-white/55"><Loader2 className="animate-spin" size={16} /> Adding end frame...</button>
                : recording
                ? <button type="button" onClick={finishRecording} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-white px-6 font-bold text-[#18101e]"><Square size={16} fill="currentColor" /> Finish recording</button>
                : <button type="button" onClick={startRecording} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-red-500 px-6 font-bold"><span className="h-3 w-3 rounded-full bg-white" /> Start recording</button>}
            </div>
            <p className="mt-3 text-center text-xs text-white/35">A Just4You.buzz watermark and two-second ending frame are added to the recorded file.</p>
          </section>
        )}

        {(stage === "preview" || stage === "sending") && previewUrl && (
          <section>
            <video src={previewUrl} controls playsInline className="mx-auto aspect-[9/16] max-h-[58vh] w-full rounded-lg bg-black object-contain" />
            <div className="mt-6 space-y-4 border-y border-white/10 py-6">
              <label className="block text-sm font-semibold text-white/70">Your name
                <input value={name} onChange={(event) => setName(event.target.value.slice(0, 50))} maxLength={50} placeholder="Optional" className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.05] px-4 py-3 font-normal text-white outline-none focus:border-[#ff9e4f]" />
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-white/60">
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-[#ff6f9c]" />
                <span>I consent to sharing this reaction with the creator. They may download and post this branded video on Instagram or WhatsApp Status.</span>
              </label>
              {error && <p role="alert" className="rounded-lg border border-rose-400/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-200">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={retake} disabled={stage === "sending"} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/15 font-semibold text-white/65 disabled:opacity-40"><RotateCcw size={16} /> Retake</button>
                <button type="button" onClick={sendReaction} disabled={!consent || stage === "sending"} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ff8a5c] to-[#ff5f93] font-bold disabled:opacity-40">
                  {stage === "sending" ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />} {stage === "sending" ? "Sending..." : "Send reaction"}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function MessageState({ icon, title, message }: { icon: string; title: string; message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#100a16] px-5 text-center text-white">
      <div className="max-w-md"><div className="mb-5 text-5xl">{icon}</div><h1 className="font-playfair text-3xl font-bold">{title}</h1><p className="mt-3 leading-7 text-white/55">{message}</p></div>
    </main>
  );
}