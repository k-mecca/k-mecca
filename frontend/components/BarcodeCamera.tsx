"use client";

import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import Scanner from "./Scanner";
import { useCustomerBarcodeStore } from "@/store/customerBarcodeStore";
import { useScanStore } from "@/store/scanStore";
import { productGet } from "@/service/staff";

type BarcodeCameraProps = {
  getVideo: () => HTMLVideoElement | null | undefined;
  onDetected?: (barcode: string) => void;
};

async function waitForVideo(
  getVideo: () => HTMLVideoElement | null | undefined,
  isCancelled: () => boolean,
): Promise<HTMLVideoElement | null> {
  const deadline = Date.now() + 5000;

  while (Date.now() < deadline) {
    if (isCancelled()) return null;

    const video = getVideo();
    if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      return video;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return getVideo() ?? null;
}

function BarcodeCamera({ getVideo, onDetected }: BarcodeCameraProps) {
  const onDetectedRef = useRef(onDetected);
  const detectedRef = useRef(false);
  const setCustomerBarcode = useCustomerBarcodeStore((state) => state.setCustomerBarcode);
  const setBarcodeResult = useScanStore((state) => state.setBarcodeResult);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    detectedRef.current = false;
    let cancelled = false;
    let controls: IScannerControls | undefined;
    const reader = new BrowserMultiFormatReader();

    void (async () => {
      try {
        const video = await waitForVideo(getVideo, () => cancelled);
        if (!video || cancelled) return;

        // 이미 재생 중인 Webcam video라 decodeFromVideoElement(play 재시도) 대신 scan만 사용
        controls = reader.scan(video, (result) => {
          if (!result || detectedRef.current || cancelled) return;

          const barcodeNumber = result.getText();
          detectedRef.current = true;
          setCustomerBarcode(barcodeNumber);
          onDetectedRef.current?.(barcodeNumber);

          void (async () => {
            try {
              const barcodeData = await productGet(barcodeNumber);
              console.log(barcodeData);

              if (barcodeData.registered === true) {
                setBarcodeResult(barcodeData);
              }

              controls?.stop();
            } catch (error) {
              console.error(error);
              detectedRef.current = false;
            }
          })();
        });

        if (cancelled) {
          controls.stop();
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
        }
      }
    })();

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [getVideo, setCustomerBarcode, setBarcodeResult]);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
      <Scanner />
    </div>
  );
}

export default BarcodeCamera;
