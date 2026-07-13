"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BrowserMultiFormatReader } from "@zxing/browser";
import Header from "./Header";
import Main from "./Main";

export default function Home() {
  const router = useRouter();
  const [isScanned, setIsScanned] = useState(true);
  const [photos, setPhotos] = useState<File[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let controls: { stop: () => void } | undefined;

    (async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!devices.length) {
          return;
        }

        controls = await codeReader.decodeFromConstraints(
          {
            video: { facingMode: { ideal: "environment" } }, // 후면 카메라 우선 요청 (전면은 "user")
          },
          videoRef.current!,
          (res) => {
            if (res) {
              setIsScanned(true);
            }
          },
        );
      } catch (e) {
        console.error(e);
      }
    })();

    return () => controls?.stop();
  }, []);

  const onCapture = async () => {
    if (photos.length === 4) return;

    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return;

    const file = new File([blob], `photo-${photos.length + 1}-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

    setPhotos((prev) => [...prev, file]);
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
      />
      <Header />
      <Main
        isScanned={isScanned}
        photoCount={photos.length}
        onCapture={onCapture}
      />
    </div>
  );
}
