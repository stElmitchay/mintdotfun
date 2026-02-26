"use client";

import { useState, useCallback } from "react";
import type { MirrorTypeConfig } from "@/lib/mirrors/types";

export type CreationStep = "input" | "edit" | "publish" | "complete";

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function useMirrorCreation() {
  const [step, setStep] = useState<CreationStep>("input");
  const [config, setConfig] = useState<MirrorTypeConfig | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdMirrorId, setCreatedMirrorId] = useState<string | null>(null);

  const generateConfig = useCallback(
    async (cityName: string, country?: string, theme?: string) => {
      setGenerating(true);
      setError(null);

      try {
        const res = await fetch("/api/mirrors/generate-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cityName, country, theme }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to generate config");
        }

        const data = await res.json();
        setConfig(data.config);
        setValidation(data.validation);
        setStep("edit");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to generate config"
        );
      } finally {
        setGenerating(false);
      }
    },
    []
  );

  const updateConfig = useCallback(
    (updates: Partial<MirrorTypeConfig>) => {
      if (!config) return;
      setConfig({ ...config, ...updates });
    },
    [config]
  );

  const publish = useCallback(
    async (creatorWallet: string, paymentTxSignature: string) => {
      if (!config) return;

      setPublishing(true);
      setError(null);

      try {
        const res = await fetch("/api/mirrors/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            config,
            creatorWallet,
            paymentTxSignature,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to create mirror");
        }

        const data = await res.json();
        setCreatedMirrorId(data.mirrorTypeId);
        setStep("complete");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create mirror"
        );
      } finally {
        setPublishing(false);
      }
    },
    [config]
  );

  const goToPublish = useCallback(() => setStep("publish"), []);
  const goBackToEdit = useCallback(() => setStep("edit"), []);
  const reset = useCallback(() => {
    setStep("input");
    setConfig(null);
    setValidation(null);
    setError(null);
    setCreatedMirrorId(null);
  }, []);

  return {
    step,
    config,
    validation,
    generating,
    publishing,
    error,
    createdMirrorId,
    generateConfig,
    updateConfig,
    goToPublish,
    goBackToEdit,
    publish,
    reset,
  };
}
