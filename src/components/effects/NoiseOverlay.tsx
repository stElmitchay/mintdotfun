"use client";

import { useEffect, useState } from "react";

export default function NoiseOverlay() {
  const [noiseUrl, setNoiseUrl] = useState("");

  useEffect(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.createImageData(size, size);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const v = Math.random() * 255;
      imageData.data[i] = v;
      imageData.data[i + 1] = v;
      imageData.data[i + 2] = v;
      imageData.data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    setNoiseUrl(canvas.toDataURL("image/png"));
  }, []);

  if (!noiseUrl) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9990] grain-animation"
      style={{
        backgroundImage: `url(${noiseUrl})`,
        backgroundRepeat: "repeat",
        backgroundSize: "128px 128px",
        opacity: 0.035,
        mixBlendMode: "overlay",
      }}
    />
  );
}
