"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserMultiFormatReader } from "@zxing/browser";
import Header from "./Header";
import Main from "./Main";
import { Spinner } from "./ui/spinner";
import { useProductStore } from "@/store/productStore";
import { productGet } from "@/service/staff";
import NoProductDialog from "./NoProductDialog";

export default function Home() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const lookingUpRef = useRef(false);
  const confirmedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [shutterFlash, setShutterFlash] = useState(false);

  const barcode = useProductStore((state) => state.barcode);
  const setBarcode = useProductStore((state) => state.setBarcode);
  const photos = useProductStore((state) => state.photos);
  const addPhoto = useProductStore((state) => state.addPhoto);
  const resetPhotos = useProductStore((state) => state.resetPhotos);
  const setIsCompleted = useProductStore((state) => state.setIsCompleted);
  const isNavigating = photos.length === 4 && Boolean(barcode);

  useEffect(() => {
    resetPhotos();
    setBarcode("");
    setIsCompleted(false);
    lookingUpRef.current = false;
    confirmedRef.current = false;

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
            if (!res || lookingUpRef.current || confirmedRef.current) return;
            if (useProductStore.getState().barcode) return;

            const barcodeNumber = res.getText();
            lookingUpRef.current = true;

            (async () => {
              try {
                const result = await productGet(barcodeNumber);

                if (result.registered === true) {
                  confirmedRef.current = true;
                  setBarcode(barcodeNumber);
                  return;
                }

                setOpen(true);
              } catch (error) {
                console.error(error);
                lookingUpRef.current = false;
              }
            })();
          },
        );
      } catch (e) {
        console.error(e);
      }
    })();

    return () => controls?.stop();
  }, [resetPhotos, setBarcode, setIsCompleted]);

  const handleNoProductChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      lookingUpRef.current = false;
    }
  };

  const onCapture = async () => {
    if (photos.length === 4 || shutterFlash) return;

    const video = videoRef.current;
    if (!video) return;

    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 100);

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

    addPhoto(file);
  };

  useEffect(() => {
    if (!isNavigating) return;

    const timer = setTimeout(() => {
      router.push(`/admin/${barcode}`);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isNavigating, barcode, router]);

  return (
    <div className={`relative h-full w-full overflow-hidden ${isNavigating ? "bg-white" : ""}`}>
      <video
        ref={videoRef}
        className={`h-full w-full object-cover ${isNavigating ? "invisible" : ""}`}
      />
      {!isNavigating && (
        <>
          <Header />
          <Main
            isScanned={barcode || null}
            photoCount={photos.length}
            onCapture={onCapture}
          />
        </>
      )}
      <NoProductDialog
        open={open}
        onOpenChange={handleNoProductChange}
      />

      {shutterFlash && <div className="absolute inset-0 z-20 bg-black" />}

      {isNavigating && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white">
          <Spinner className="text-kmecca size-12" />
        </div>
      )}
    </div>
  );
}
