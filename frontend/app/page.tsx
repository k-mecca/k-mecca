"use client";

import Webcam from "react-webcam";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100 p-4">
      <Webcam
        audio={false}
        playsInline
        className="w-full max-w-md rounded-lg border border-gray-300"
      />
    </main>
  );
}
