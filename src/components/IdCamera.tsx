"use client";

import { useEffect, useRef, useState } from "react";
import { frameReady } from "../lib/scan-flags";
import { imageQuality } from "../lib/keys-check";

const READY_FRAMES = 3;

function luminanceOf(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return [];
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const values: number[] = [];
  for (let index = 0; index < pixels.length; index += 4) {
    values.push(Math.round((pixels[index] * 0.3) + (pixels[index + 1] * 0.59) + (pixels[index + 2] * 0.11)));
  }
  return values;
}

/** On-screen ID frame. The shutter fires when the picture is sharp and bright enough. */
export function IdCamera({
  title,
  facing,
  sample = false,
  onCapture,
}: {
  title: string;
  facing: "environment" | "user";
  sample?: boolean;
  onCapture: (blob: Blob) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState(false);
  const [note, setNote] = useState(sample ? "This preview does not open the camera." : "");
  const [busy, setBusy] = useState(false);
  const shot = useRef(false);

  useEffect(() => {
    if (sample || !live) return undefined;
    const video = videoRef.current;
    if (!video) return undefined;
    let stream: MediaStream | null = null;
    let timer = 0;
    let streak = 0;
    let stopped = false;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: facing, width: { ideal: 1600 }, height: { ideal: 1200 } }, audio: false })
      .then(async (opened) => {
        if (stopped) {
          opened.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = opened;
        video.srcObject = opened;
        await video.play();
        timer = window.setInterval(() => {
          if (stopped || shot.current || !video.videoWidth) return;
          const sampleCanvas = document.createElement("canvas");
          sampleCanvas.width = 64;
          sampleCanvas.height = Math.max(1, Math.round((64 * video.videoHeight) / video.videoWidth));
          const context = sampleCanvas.getContext("2d", { willReadFrequently: true });
          if (!context) return;
          context.drawImage(video, 0, 0, sampleCanvas.width, sampleCanvas.height);
          const warnings = imageQuality({
            width: video.videoWidth,
            height: video.videoHeight,
            sampleWidth: sampleCanvas.width,
            sampleHeight: sampleCanvas.height,
            luminance: luminanceOf(sampleCanvas),
          });
          if (frameReady(warnings)) {
            streak += 1;
            setNote("Hold still.");
            if (streak >= READY_FRAMES) void capture();
          } else {
            streak = 0;
            setNote(warnings[0] || "");
          }
        }, 400);
      })
      .catch(() => {
        if (!stopped) setNote("The camera did not open. Choose a photo instead.");
      });
    return () => {
      stopped = true;
      window.clearInterval(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [facing, live, sample]);

  async function capture() {
    const video = videoRef.current;
    if (!video || shot.current || !video.videoWidth) return;
    shot.current = true;
    setBusy(true);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    setBusy(false);
    if (!blob) {
      shot.current = false;
      setNote("That photo could not be taken. Try again.");
      return;
    }
    onCapture(blob);
  }

  return (
    <div className="scan-camera">
      <p className="scan-camera-title">{title}</p>
      <div className="id-stage">
        {sample || !live ? <div className="id-stage-still" /> : <video ref={videoRef} playsInline muted autoPlay />}
        <div className="id-frame" aria-hidden="true" />
      </div>
      {note ? <p className="quiet">{note}</p> : null}
      <div className="scan-actions">
        {sample || live ? null : <button className="btn" type="button" onClick={() => setLive(true)}>Open the camera</button>}
        <button className="btn" type="button" disabled={sample || busy || !live} onClick={() => void capture()}>Take photo</button>
      </div>
    </div>
  );
}
