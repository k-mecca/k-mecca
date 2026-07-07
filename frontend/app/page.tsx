"use client";

import Webcam from "react-webcam";

export default function Home() {
  return (
    <div className="mx-auto h-screen w-full max-w-xl">
      <div className="h-full w-full overflow-hidden border">
        <Webcam
          audio={false}
          playsInline
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
