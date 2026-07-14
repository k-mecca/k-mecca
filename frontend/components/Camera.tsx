"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BrowserMultiFormatReader } from "@zxing/browser";
import Header from "./Header";
import Main from "./Main";
import { useProductStore } from "@/store/productStore";

export default function Home() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const barcode = useProductStore((state) => state.barcode);
  const setBarcode = useProductStore((state) => state.setBarcode);
  const images = useProductStore((state) => state.images);
  const setImage = useProductStore((state) => state.setImage);
  const resetImages = useProductStore((state) => state.resetImages);
  const setIsCompleted = useProductStore((state) => state.setIsCompleted);

  useEffect(() => {
    resetImages();
    setBarcode("");
    setIsCompleted(false);

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
              setBarcode(res.getText());
            }
          },
        );
      } catch (e) {
        console.error(e);
      }
    })();

    return () => controls?.stop();
  }, [resetImages, setBarcode, setIsCompleted]);

  const onCapture = async () => {
    if (images.length === 4) return;

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

    const file = new File([blob], `photo-${images.length + 1}-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

    setImage(URL.createObjectURL(file));
  };

  useEffect(() => {
    if (images.length === 4 && barcode) {
      const timer = setTimeout(() => {
        router.push(`/admin/${barcode}`);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [images, barcode, router]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
      />
      <Header />
      <Main
        isScanned={barcode || null}
        photoCount={images.length}
        onCapture={onCapture}
      />
    </div>
  );
}
