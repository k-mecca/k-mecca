"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import BarcodeCamera from "@/components/BarcodeCamera";
import Header from "@/components/customer/Header";
import Scanner from "@/components/Scanner";
import ScanOverlay from "@/components/customer/ScanOverlay";
import ScanHistory from "@/components/customer/ScanHistory";
import UploadRecognition from "@/components/customer/UploadRecognition";
import ResultCarousel from "@/components/customer/ResultCarousel";
import BarcodeScanResult from "@/components/customer/BarcodeScanResult";
import Footer from "@/components/customer/Footer";
import { scanRecognitionPost } from "@/service/customer";
import { productShareGet } from "@/service/product-share";
import { useScanStore } from "@/store/scanStore";
import { useCustomerStore } from "@/store/customerStore";
import { useFooterStore } from "@/store/footerStore";
import type { ProductData } from "@/types/product";
import Image from "next/image";
import { cn } from "@/lib/utils";

type ScanHistoryEntry = {
  id: string;
  url: string;
  thumbnailUrl: string;
  candidates: ProductData[] | null;
};

const GUIDE_PADDING = 24; // Scanner 이미지 여백 p-6 (24px)
const CAMERA_INTERVAL_MS = 500; // 화면 분석 주기

const CENTER_CONFIRM = 2; // 중앙인지 2번 체크
const STABLE_CONFIRM = 2; // 흔들림 없는지 2번 체크

// 1단계 — 중앙 배치
// THRESHOLD = 조건 통과 점수, RATIO = 변화 비율
const VARIANCE_THRESHOLD = 70; // 가이드 박스 물체 인식 기준 점수
const CONTRAST_THRESHOLD = 6; // 가이드 박스 안팎 밝기 차이
const VARIANCE_SURROUND_RATIO = 1.12; // 중앙 분산이 주변보다 이만큼 커야 물체로 인정
const BASELINE_CHANGE_RATIO = 0.07; // 카메라 켠 직후의 픽셀 변화

// 2단계 — 흔들림 (이전 프레임과 현재 비교)
const STABLE_CHANGE_RATIO = 0.1; // 픽셀 변화
const PIXEL_DIFF_THRESHOLD = 20; // 밝기 변화

// 3단계 — 밝기 & 선명도
const BRIGHTNESS_MIN = 45;
const BRIGHTNESS_MAX = 215;
const SHARPNESS_THRESHOLD = 80;

// 4단계 — 1초 유지 후 촬영
const READY_HOLD_MS = 1000;

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageQualityResult {
  ok: boolean;
  brightness: number;
  sharpness: number;
}

// 가이드 박스 중앙 정렬 (Scanner: inset padding + aspect-square w-full)
function getGuideBox(containerWidth: number, containerHeight: number): Rectangle {
  const padding = GUIDE_PADDING;
  const size = Math.min(containerWidth, containerHeight) - padding * 2;
  return {
    x: (containerWidth - size) / 2,
    y: (containerHeight - size) / 2,
    width: size,
    height: size,
  };
}

// 가이드 박스 화면 픽셀 -> 실제 웹캠 픽셀로 변환
function realWebcamPixel(
  screenRect: Rectangle,
  videoWidth: number,
  videoHeight: number,
  containerWidth: number,
  containerHeight: number,
): Rectangle {
  const scale = Math.max(containerWidth / videoWidth, containerHeight / videoHeight);
  const renderedWidth = videoWidth * scale;
  const renderedHeight = videoHeight * scale;
  const offsetX = (containerWidth - renderedWidth) / 2;
  const offsetY = (containerHeight - renderedHeight) / 2;

  return {
    x: (screenRect.x - offsetX) / scale,
    y: (screenRect.y - offsetY) / scale,
    width: screenRect.width / scale,
    height: screenRect.height / scale,
  };
}

// 가이드 박스가 웹캠 범위를 벗어나지 않도록 조정
function clampGuideBox(rect: Rectangle, maxWidth: number, maxHeight: number): Rectangle {
  const x = Math.max(0, Math.min(rect.x, maxWidth - 1));
  const y = Math.max(0, Math.min(rect.y, maxHeight - 1));
  const width = Math.max(1, Math.min(rect.width, maxWidth - x));
  const height = Math.max(1, Math.min(rect.height, maxHeight - y));
  return { x, y, width, height };
}

// 웹캠 전체 화면을 JPEG Blob으로 저장
async function captureWebcamPhoto(video: HTMLVideoElement): Promise<Blob | null> {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  if (!videoWidth || !videoHeight) return null;

  const canvas = document.createElement("canvas");
  canvas.width = videoWidth;
  canvas.height = videoHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
}

/** 가이드 박스 영역만 잘라 썸네일 Blob 생성 (화면 스캐너와 동일 영역) */
async function createGuideBoxThumbnail(
  blob: Blob,
  video: HTMLVideoElement,
  container: HTMLDivElement,
): Promise<Blob | null> {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  if (!videoWidth || !videoHeight) return null;

  const screenGuide = getGuideBox(container.clientWidth, container.clientHeight);
  const videoGuide = clampGuideBox(
    realWebcamPixel(screenGuide, videoWidth, videoHeight, container.clientWidth, container.clientHeight),
    videoWidth,
    videoHeight,
  );

  const cropX = Math.floor(videoGuide.x);
  const cropY = Math.floor(videoGuide.y);
  const cropW = Math.floor(videoGuide.width);
  const cropH = Math.floor(videoGuide.height);
  if (cropW < 1 || cropH < 1) return null;

  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = cropW;
  canvas.height = cropH;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return null;
  }

  ctx.drawImage(bitmap, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  bitmap.close();

  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
}

// 픽셀 밝기 계산
function pixelBrightness(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// 밝기 분산 계산 (높을수록 물체 존재 가능성) — 1단계 입력값
function brightnessVariance(imageData: ImageData): number {
  const { data } = imageData;
  const count = data.length / 4;
  let sum = 0;
  let sumSq = 0;

  for (let i = 0; i < data.length; i += 4) {
    const lum = pixelBrightness(data[i], data[i + 1], data[i + 2]);
    sum += lum;
    sumSq += lum * lum;
  }

  const mean = sum / count;
  return sumSq / count - mean * mean;
}

// pixelBrightness를 활용해 평균 밝기 계산 — 1단계·3단계에서 사용
function averageBrightness(imageData: ImageData): number {
  const { data } = imageData;
  const count = data.length / 4;
  let sum = 0;

  for (let i = 0; i < data.length; i += 4) {
    sum += pixelBrightness(data[i], data[i + 1], data[i + 2]);
  }

  return sum / count;
}

// 가이드 박스 guideBoxPadding의 평균 밝기, 분산 계산 — 중앙과 비교용
function guideBoxSurroundStats(
  context: CanvasRenderingContext2D,
  guide: Rectangle,
  guideBoxPadding: number,
  maxWidth: number,
  maxHeight: number,
): { mean: number; variance: number } | null {
  const strips: ImageData[] = [];
  const x = Math.floor(guide.x);
  const y = Math.floor(guide.y);
  const w = Math.floor(guide.width);
  const h = Math.floor(guide.height);
  const pad = Math.max(4, guideBoxPadding);

  const topH = Math.min(pad, y);
  if (topH > 0) strips.push(context.getImageData(x, y - topH, w, topH));

  const bottomY = y + h;
  const bottomH = Math.min(pad, maxHeight - bottomY);
  if (bottomH > 0) strips.push(context.getImageData(x, bottomY, w, bottomH));

  const leftW = Math.min(pad, x);
  if (leftW > 0) strips.push(context.getImageData(x - leftW, y, leftW, h));

  const rightX = x + w;
  const rightW = Math.min(pad, maxWidth - rightX);
  if (rightW > 0) strips.push(context.getImageData(rightX, y, rightW, h));

  if (strips.length === 0) return null;

  let weightedMeanSum = 0;
  let weightedVarSum = 0;
  let totalPixels = 0;

  for (const strip of strips) {
    const pixels = strip.data.length / 4;
    weightedMeanSum += averageBrightness(strip) * pixels;
    weightedVarSum += brightnessVariance(strip) * pixels;
    totalPixels += pixels;
  }

  return {
    mean: weightedMeanSum / totalPixels,
    variance: weightedVarSum / totalPixels,
  };
}

// 다음 프레임과 비교를 위해 현재 프레임은 따로 클론
function cloneImageData(imageData: ImageData): ImageData {
  return new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
}

// 두 프레임 비교 -> 변화한 픽셀 비율 — 1·2단계에서 사용 */
function frameChangeRatio(current: ImageData, previous: ImageData): number {
  let changedPixels = 0;
  const totalPixels = current.data.length / 4;

  for (let i = 0; i < current.data.length; i += 4) {
    const lumCurrent = pixelBrightness(current.data[i], current.data[i + 1], current.data[i + 2]);
    const lumPrevious = pixelBrightness(previous.data[i], previous.data[i + 1], previous.data[i + 2]);

    if (Math.abs(lumCurrent - lumPrevious) > PIXEL_DIFF_THRESHOLD) {
      changedPixels++;
    }
  }

  return changedPixels / totalPixels;
}

// =============================================================================
// 계산된 값을 보고 조건을 판정하는 함수
// =============================================================================

// 1단계 — 상품이 중앙에 있는지 판단
function isCenter(
  centerVariance: number,
  centerMean: number,
  surround: { mean: number; variance: number } | null,
): boolean {
  const hasDetail = centerVariance > VARIANCE_THRESHOLD;
  const differsFromSurround = surround !== null && Math.abs(centerMean - surround.mean) > CONTRAST_THRESHOLD;
  const moreDetailThanSurround = surround !== null && centerVariance > surround.variance * VARIANCE_SURROUND_RATIO;

  return hasDetail && (differsFromSurround || moreDetailThanSurround);
}

// 카메라 켠 직후와 현재 프레임을 비교
function isBaselineChanged(current: ImageData, baseline: ImageData): boolean {
  return frameChangeRatio(current, baseline) > BASELINE_CHANGE_RATIO;
}

// 2단계 — 흔들림이 없는지?
function isStable(changeRatio: number): boolean {
  return changeRatio < STABLE_CHANGE_RATIO;
}

// 3단계 — 밝기 통과 여부
function isBrightnessOk(mean: number): boolean {
  return mean >= BRIGHTNESS_MIN && mean <= BRIGHTNESS_MAX;
}

// 선명도 체크
function sharpnessScore(imageData: ImageData): number {
  const { data, width, height } = imageData;
  const step = 2;

  const lumAt = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    return pixelBrightness(data[i], data[i + 1], data[i + 2]);
  };

  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const center = lumAt(x, y);
      const lap = Math.abs(4 * center - lumAt(x - 1, y) - lumAt(x + 1, y) - lumAt(x, y - 1) - lumAt(x, y + 1));
      sum += lap;
      sumSq += lap * lap;
      count += 1;
    }
  }

  if (count === 0) return 0;

  const mean = sum / count;
  return sumSq / count - mean * mean;
}

function checkImageQuality(imageData: ImageData): ImageQualityResult {
  const brightness = averageBrightness(imageData);
  const sharpness = sharpnessScore(imageData);
  const ok = isBrightnessOk(brightness) && sharpness >= SHARPNESS_THRESHOLD;

  return { ok, brightness, sharpness };
}

interface FrameSnapshot {
  centerData: ImageData;
  centerVariance: number;
  centerMean: number;
  surround: { mean: number; variance: number } | null;
  contrast: number | null;
}

// 0.5초마다 웹캠 프레임을 캡처해 판정에 필요한 데이터로 가공
function captureFrame(
  video: HTMLVideoElement | null | undefined,
  canvas: HTMLCanvasElement | null,
  container: HTMLDivElement | null,
): FrameSnapshot | null {
  if (!video || !canvas || !container || video.readyState !== 4) return null;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  canvas.width = videoWidth;
  canvas.height = videoHeight;
  context.drawImage(video, 0, 0, videoWidth, videoHeight);

  const screenGuide = getGuideBox(containerWidth, containerHeight);
  const videoGuide = clampGuideBox(
    realWebcamPixel(screenGuide, videoWidth, videoHeight, containerWidth, containerHeight),
    videoWidth,
    videoHeight,
  );

  const centerData = context.getImageData(
    Math.floor(videoGuide.x),
    Math.floor(videoGuide.y),
    Math.floor(videoGuide.width),
    Math.floor(videoGuide.height),
  );

  const guideBoxPadding = Math.floor(Math.min(videoGuide.width, videoGuide.height) * 0.15);
  const surround = guideBoxSurroundStats(context, videoGuide, guideBoxPadding, videoWidth, videoHeight);

  const centerVariance = brightnessVariance(centerData);
  const centerMean = averageBrightness(centerData);

  return {
    centerData,
    centerVariance,
    centerMean,
    surround,
    contrast: surround !== null ? Math.abs(centerMean - surround.mean) : null,
  };
}

// =============================================================================
// 0.5초 주기로 프레임 분석 -> 단계별 판정 컴포넌트
// =============================================================================
export default function ObjectDetector() {
  const containerRef = useRef<HTMLDivElement>(null);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 단계별 카운터·프레임 저장 (리렌더 없이 유지)
  const centerCountRef = useRef(0);
  const stableCountRef = useRef(0);
  const previousCenterFrameRef = useRef<ImageData | null>(null);
  const baselineCenterFrameRef = useRef<ImageData | null>(null);
  const readySinceRef = useRef<number | null>(null);
  const captureTriggeredRef = useRef(false);
  const isCapturedRef = useRef(false);
  const selectedHistoryIdRef = useRef<string | null>(null);

  const [guideBox, setGuideBox] = useState<Rectangle | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);
  const scanHistoryRef = useRef<ScanHistoryEntry[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [shareQueryImageUrl, setShareQueryImageUrl] = useState<string | null>(null);
  const [captureBackgroundUrl, setCaptureBackgroundUrl] = useState<string | null>(null);
  const { scanResult, setScanResult, barcodeResult, setBarcodeResult, isCaptured, setIsCaptured } = useScanStore();
  const uploadResult = useCustomerStore((state) => state.uploadResult);
  const uploadPreview = useCustomerStore((state) => state.uploadPreview);
  const uploadScanning = useCustomerStore((state) => state.uploadScanning);
  const uploadCompareMatch = useCustomerStore((state) => state.uploadCompareMatch);
  const setUploadCompareMatch = useCustomerStore((state) => state.setUploadCompareMatch);
  const clearUploadImage = useCustomerStore((state) => state.clearUploadImage);
  const isShareView = Boolean(shareQueryImageUrl);
  const selectedScanUrl = scanHistory.find((item) => item.id === selectedHistoryId)?.url ?? null;
  // 새 캡처 이미지를 우선 — 이전 히스토리 이미지가 잠깐 보이는 깜빡임 방지
  const frozenBackgroundUrl =
    shareQueryImageUrl ?? (isCaptured || isRecognizing ? (captureBackgroundUrl ?? selectedScanUrl) : null);
  // 인식 완료 후 결과 화면 — 배경 이미지 양옆 패딩으로 축소
  const isFrozenInset = Boolean(frozenBackgroundUrl) && isCaptured && !isRecognizing;
  const [frozenInsetAnimated, setFrozenInsetAnimated] = useState(false);

  // 결과 진입 시에만 애니메이션, 뒤로가기(해제)는 즉시
  useEffect(() => {
    if (!isFrozenInset) return;

    const id = requestAnimationFrame(() => setFrozenInsetAnimated(true));
    return () => cancelAnimationFrame(id);
  }, [isFrozenInset]);

  const resetReadyHold = useCallback(() => {
    readySinceRef.current = null;
  }, []);

  /** 준비 유지·촬영 상태 초기화 (재촬영 가능하게) */
  const resetCaptureSession = useCallback(() => {
    readySinceRef.current = null;
    captureTriggeredRef.current = false;
  }, []);

  /** 스캔·캡처 상태 전체 초기화 (미리보기 이미지는 유지) */
  const resetScan = useCallback(() => {
    centerCountRef.current = 0;
    stableCountRef.current = 0;
    previousCenterFrameRef.current = null;
    baselineCenterFrameRef.current = null;
    readySinceRef.current = null;
    captureTriggeredRef.current = false;
    isCapturedRef.current = false;

    setIsRecognizing(false);
    setIsCaptured(false);
    setScanResult(null);
    setBarcodeResult(null);
    setShareQueryImageUrl(null);
    setCaptureBackgroundUrl(null);
    setFrozenInsetAnimated(false);
    selectedHistoryIdRef.current = null;
    setSelectedHistoryId(null);
    clearUploadImage(); // uploadResult + preview 전체 초기화

    if (new URLSearchParams(window.location.search).has("shareId")) {
      window.history.replaceState({}, "", "/");
    }
  }, [setIsCaptured, setScanResult, setBarcodeResult, clearUploadImage]);

  const removeScanHistory = useCallback(
    (id: string) => {
      const target = scanHistoryRef.current.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
        if (target.thumbnailUrl !== target.url) URL.revokeObjectURL(target.thumbnailUrl);
      }

      const next = scanHistoryRef.current.filter((item) => item.id !== id);
      scanHistoryRef.current = next;
      setScanHistory(next);

      if (next.length === 0) {
        selectedHistoryIdRef.current = null;
        setSelectedHistoryId(null);
        setScanResult(null);
        setIsCaptured(false);
        setCaptureBackgroundUrl(null);
        return;
      }

      if (selectedHistoryIdRef.current === id) {
        const nextSelected = next[0];
        selectedHistoryIdRef.current = nextSelected.id;
        setSelectedHistoryId(nextSelected.id);
        setScanResult(nextSelected.candidates);
        setCaptureBackgroundUrl(nextSelected.url);
      }
    },
    [setIsCaptured, setScanResult],
  );

  const selectScanHistory = useCallback(
    (id: string) => {
      const item = scanHistoryRef.current.find((entry) => entry.id === id);
      if (!item) return;

      selectedHistoryIdRef.current = id;
      setSelectedHistoryId(id);
      setScanResult(item.candidates);
      setCaptureBackgroundUrl(item.url);
      setIsCaptured(true);
    },
    [setIsCaptured, setScanResult],
  );

  // ⑥ 캡처 — 4단계(품질 통과) 도달 후 유지 시간을 재고, 다 채워지면 1회만 실행
  const captureIfReady = useCallback(() => {
    if (isCapturedRef.current) return;

    if (readySinceRef.current === null) {
      readySinceRef.current = Date.now();
    }
    const elapsed = Date.now() - readySinceRef.current;

    if (elapsed < READY_HOLD_MS || captureTriggeredRef.current) return;

    const video = webcamRef.current?.video;
    const container = containerRef.current;
    if (!video || !container) return;

    captureTriggeredRef.current = true;

    // 웹캠 전체 화면 촬영
    void (async () => {
      const blob = await captureWebcamPhoto(video);
      if (!blob) {
        captureTriggeredRef.current = false;
        return;
      }

      const id = crypto.randomUUID();
      const url = URL.createObjectURL(blob);

      // 새 캡처를 즉시 배경에 반영 (이전 이미지 깜빡임 방지)
      isCapturedRef.current = true;
      setFrozenInsetAnimated(false);
      setCaptureBackgroundUrl(url);
      setIsRecognizing(true);

      const thumbnailBlob = await createGuideBoxThumbnail(blob, video, container);
      const thumbnailUrl = thumbnailBlob ? URL.createObjectURL(thumbnailBlob) : url;

      try {
        const result = await scanRecognitionPost(blob);

        const footerButton = useFooterStore.getState().buttonValue;
        const uploaded = useCustomerStore.getState().uploadResult;

        // 업로드 비교 모드 — ResultCarousel 대신 일치 여부만 기록
        if (footerButton === "product" && uploaded) {
          const topBarcode = result.candidates[0]?.barcode;
          setUploadCompareMatch(Boolean(topBarcode && topBarcode === uploaded.barcode));
          setCaptureBackgroundUrl(null);
          URL.revokeObjectURL(url);
          if (thumbnailUrl !== url) URL.revokeObjectURL(thumbnailUrl);
          return;
        }

        const entry: ScanHistoryEntry = { id, url, thumbnailUrl, candidates: result.candidates };

        scanHistoryRef.current = [entry, ...scanHistoryRef.current];
        setScanHistory(scanHistoryRef.current);
        selectedHistoryIdRef.current = id;
        setSelectedHistoryId(id);
        setScanResult(result.candidates);
        setIsCaptured(true);
      } catch (error) {
        console.error(error);
        setCaptureBackgroundUrl(null);
        URL.revokeObjectURL(url);
        if (thumbnailUrl !== url) URL.revokeObjectURL(thumbnailUrl);
        isCapturedRef.current = false;
        captureTriggeredRef.current = false;
      } finally {
        setIsRecognizing(false);
      }
    })();
  }, [setScanResult, setIsCaptured, setUploadCompareMatch]);

  useEffect(() => {
    return () => {
      scanHistoryRef.current.forEach((item) => {
        URL.revokeObjectURL(item.url);
        if (item.thumbnailUrl !== item.url) URL.revokeObjectURL(item.thumbnailUrl);
      });
    };
  }, []);

  // 메인 실행 로직
  const detectCenter = useCallback(() => {
    if (isCapturedRef.current) return;

    const frame = captureFrame(webcamRef.current?.video, canvasRef.current, containerRef.current);
    if (!frame) return;

    if (!baselineCenterFrameRef.current) {
      baselineCenterFrameRef.current = cloneImageData(frame.centerData);
    }
    const baseline = baselineCenterFrameRef.current;
    const objectPresent = isCenter(frame.centerVariance, frame.centerMean, frame.surround);
    const changedFromBaseline = isBaselineChanged(frame.centerData, baseline);
    const centered = objectPresent || changedFromBaseline;

    // --- 1단계 : 중앙 물체 분석 ---
    if (!centered) {
      centerCountRef.current = 0;
      stableCountRef.current = 0;
      previousCenterFrameRef.current = null;
      resetCaptureSession();
      return;
    }

    centerCountRef.current += 1;

    if (centerCountRef.current < CENTER_CONFIRM) {
      previousCenterFrameRef.current = cloneImageData(frame.centerData);
      stableCountRef.current = 0;
      resetReadyHold();
      return;
    }

    // --- 2단계 : 흔들림 분석 ---
    const previousCenterFrame = previousCenterFrameRef.current;

    if (!previousCenterFrame) {
      previousCenterFrameRef.current = cloneImageData(frame.centerData);
      resetReadyHold();
      return;
    }

    const changeRatio = frameChangeRatio(frame.centerData, previousCenterFrame);
    previousCenterFrameRef.current = cloneImageData(frame.centerData);

    if (isStable(changeRatio)) {
      stableCountRef.current += 1;
    } else {
      stableCountRef.current = 0;
      resetCaptureSession();
    }

    if (stableCountRef.current < STABLE_CONFIRM) {
      resetCaptureSession();
      return;
    }

    // --- 3단계 : 밝기/선명도 분석 ---
    const quality = checkImageQuality(frame.centerData);

    if (!quality.ok) {
      resetReadyHold();
      return;
    }

    // --- 4단계 : 조건 유지 후 촬영 ---
    captureIfReady();
  }, [resetCaptureSession, resetReadyHold, captureIfReady]);

  const buttonValue = useFooterStore((state) => state.buttonValue);

  // 업로드 조회 완료 후 — 스캔 가이드가 다시 보이면 실물 인식 재개
  const isUploadCompareMode =
    buttonValue === "product" && Boolean(uploadResult) && !uploadScanning && uploadCompareMatch === null;

  // 업로드 비교 모드 재스캔 — UploadRecognition(업로드 결과)은 유지
  const rescanUploadCompare = useCallback(() => {
    setUploadCompareMatch(null);
    setIsRecognizing(false);
  }, [setUploadCompareMatch]);

  const getWebcamVideo = useCallback(() => webcamRef.current?.video ?? null, []);

  // 업로드 비교 모드 진입 시 감지 상태 초기화 (다시 촬영 가능하도록)
  useEffect(() => {
    if (!isUploadCompareMode) return;

    centerCountRef.current = 0;
    stableCountRef.current = 0;
    previousCenterFrameRef.current = null;
    baselineCenterFrameRef.current = null;
    readySinceRef.current = null;
    captureTriggeredRef.current = false;
    isCapturedRef.current = false;
  }, [isUploadCompareMode]);

  // 0.5초마다 detectCenter 로직 실행 (search 캡처 전 / 업로드 비교 모드)
  useEffect(() => {
    if (isShareView || isRecognizing) return;

    const searchMode = buttonValue === "search" && !isCaptured;
    if (!searchMode && !isUploadCompareMode) return;

    const timer = setInterval(detectCenter, CAMERA_INTERVAL_MS);
    return () => {
      clearInterval(timer);
      // search 이탈/중단 시 진행 중이던 감지 상태 초기화
      centerCountRef.current = 0;
      stableCountRef.current = 0;
      previousCenterFrameRef.current = null;
      baselineCenterFrameRef.current = null;
      readySinceRef.current = null;
      captureTriggeredRef.current = false;
    };
  }, [detectCenter, isCaptured, isRecognizing, buttonValue, isUploadCompareMode, isShareView]);

  // 공유 링크로 진입 시 스캔 결과 복원
  useEffect(() => {
    const shareId = new URLSearchParams(window.location.search).get("shareId")?.trim();
    if (!shareId) return;

    let cancelled = false;

    void (async () => {
      try {
        const data = await productShareGet(shareId);
        if (cancelled) return;

        setShareQueryImageUrl(data.queryImageUrl);
        setScanResult(data.candidates);
        setIsCaptured(true);
        isCapturedRef.current = true;
        useFooterStore.getState().setButtonValue("search");
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          alert(error instanceof Error ? error.message : "공유 결과를 불러오지 못했습니다.");
          window.history.replaceState({}, "", "/");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setScanResult, setIsCaptured]);
  // 웹캠 리사이징
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const syncGuide = () => {
      setGuideBox(getGuideBox(container.clientWidth, container.clientHeight));
    };
    syncGuide();

    // 크기가 변할때마다 가이드 박스도 리사이징
    const observer = new ResizeObserver(syncGuide);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {frozenBackgroundUrl ? (
        <div
          className={cn(
            "absolute inset-0 bg-black",
            isFrozenInset && "transition-[padding] duration-500 ease-out",
            frozenInsetAnimated ? "px-4 pb-16 pt-0" : "p-0",
          )}>
          <div className="relative h-full w-full overflow-hidden">
            <Image
              src={frozenBackgroundUrl}
              alt="scan-capture"
              fill
              unoptimized
              className="object-cover"
              priority
            />
          </div>
        </div>
      ) : (
        <Webcam
          ref={webcamRef}
          audio={false}
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: { ideal: "environment" } }} // 후면 카메라 우선 요청 (전면은 "user")
          onUserMedia={() => setIsCameraReady(true)}
          onUserMediaError={() => setIsCameraReady(false)}
        />
      )}
      {/* 화면에는 보이지 않는 웹캠 프레임 분석 캔버스 */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      <div
        ref={containerRef}
        className="absolute inset-0 z-10">
        {!isShareView && buttonValue === "search" && (
          <ScanHistory
            items={scanHistory.map(({ id, thumbnailUrl }) => ({ id, url: thumbnailUrl }))}
            selectedId={selectedHistoryId}
            onSelect={selectScanHistory}
            onRemove={removeScanHistory}
          />
        )}

        {!isShareView && isCaptured && uploadResult && !uploadScanning && (
          <div className="absolute top-28 right-0 left-0 z-10 flex flex-col items-center text-center font-medium">
            <p className="text-[18px] text-white">실물 상품과 비교할까요?</p>
            <p className="text-white">사진 속 상품과 같은지 확인할 수 있어요</p>
          </div>
        )}

        {guideBox &&
          (isShareView ||
            (isCameraReady &&
              (buttonValue === "search" || (uploadResult && !uploadScanning && buttonValue === "product")))) && (
            <>
              <div
                className={cn(
                  "pointer-events-none absolute",
                  isFrozenInset && "transition-transform duration-500 ease-out",
                  frozenInsetAnimated && "-translate-y-6",
                )}
                style={{
                  left: guideBox.x,
                  top: guideBox.y,
                  width: guideBox.width,
                  height: guideBox.height,
                }}>
                <Scanner
                  className="aspect-auto h-full w-full"
                  showMatching={uploadCompareMatch !== null}
                  isMatched={uploadCompareMatch === true}
                  onMatchingClick={rescanUploadCompare}
                />

                {!isShareView && ((!isCaptured && !isRecognizing) || (isUploadCompareMode && !isRecognizing)) && (
                  <div className="absolute inset-0 overflow-hidden rounded-[22px]">
                    <ScanOverlay />
                  </div>
                )}
              </div>

              <div
                className="pointer-events-none absolute"
                style={{
                  left: guideBox.x,
                  top: guideBox.y,
                  width: guideBox.width,
                  height: guideBox.height,
                }}
              />
            </>
          )}

        {!isShareView && buttonValue === "barcode" && <BarcodeCamera getVideo={getWebcamVideo} />}

        <div className="pointer-events-none absolute inset-0 flex flex-col">
          <div className="pointer-events-auto">
            <Header
              isCaptured={isCaptured}
              resetScan={resetScan}
            />
          </div>

          {/* 하단 컴포넌트 */}
          <div className="pointer-events-auto mt-auto">{!isShareView && uploadPreview && <UploadRecognition />}</div>

          <div className="pointer-events-auto">
            {isShareView && scanResult ? (
              <ResultCarousel photoUrl={shareQueryImageUrl} />
            ) : buttonValue === "search" && isCaptured && scanResult ? (
              <ResultCarousel
                key={selectedHistoryId ?? "scan-result"}
                photoUrl={scanHistory.find((item) => item.id === selectedHistoryId)?.url}
              />
            ) : isCaptured && barcodeResult?.registered === true ? (
              <BarcodeScanResult />
            ) : (
              !isShareView && <Footer resetScan={resetScan} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
