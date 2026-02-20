"use client";

import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [value, setValue] = useState(false);

  useEffect(() => {
    function update() {
      setValue(window.matchMedia(query).matches);
    }

    const mql = window.matchMedia(query);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return value;
}
