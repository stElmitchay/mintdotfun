import { useState, useEffect } from "react";

const WORDS = [
  "Conjuring",
  "Gallivanting",
  "Discombobulating",
  "Percolating",
  "Ruminating",
  "Alchemizing",
  "Transmuting",
  "Manifesting",
  "Hallucinating",
  "Pixelating",
  "Synthesizing",
  "Crystallizing",
  "Enchanting",
  "Incantating",
  "Daydreaming",
  "Concocting",
  "Simmering",
  "Fermenting",
  "Distilling",
  "Vaporizing",
];

export function useWhimsicalWord(active: boolean, intervalMs = 2500) {
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * WORDS.length)
  );

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % WORDS.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);

  return WORDS[index];
}
