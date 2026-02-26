"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { useUmi } from "@/hooks/useUmi";
import { useMirrorCreation } from "@/hooks/useMirrorCreation";
import { payMirrorCreationFee } from "@/lib/mirrors/createMirrorPayment";
import CityInput from "@/components/mirrors/create/CityInput";
import ConfigEditor from "@/components/mirrors/create/ConfigEditor";
import PublishStep from "@/components/mirrors/create/PublishStep";
import { useState, useEffect } from "react";

const CREATION_FEE_SOL = 0; // devnet: free. Set via env in production.

export default function CreateMirrorPage() {
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const solanaWallet = wallets[0];
  const { umi, connected } = useUmi();

  const {
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
  } = useMirrorCreation();

  const [platformWallet, setPlatformWallet] = useState<string | null>(null);

  // Fetch platform wallet (mirror authority pubkey)
  useEffect(() => {
    fetch("/api/mirrors/authority")
      .then((res) => res.json())
      .then((data) => setPlatformWallet(data.authority))
      .catch(() => {});
  }, []);

  const handlePublish = async () => {
    if (!solanaWallet?.address || !umi || !config) return;

    let txSignature = "devnet-no-fee";

    if (CREATION_FEE_SOL > 0 && platformWallet) {
      try {
        txSignature = await payMirrorCreationFee(
          umi,
          platformWallet,
          CREATION_FEE_SOL
        );
      } catch (err) {
        return; // Payment failed — error handled by wallet
      }
    }

    await publish(solanaWallet.address, txSignature);
  };

  // Not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-lg mx-auto text-center pt-20">
          <h1 className="text-2xl font-medium text-gray-12 mb-3">
            Create a Mirror
          </h1>
          <p className="text-sm text-gray-9 mb-6">
            Connect your wallet to create a Cultural Mirror.
          </p>
          <button
            onClick={login}
            className="bg-accent text-[var(--color-on-accent)] px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-all"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Back link */}
        <Link
          href="/mirrors"
          className="inline-flex items-center gap-1.5 text-sm text-gray-9 hover:text-gray-12 transition-colors mb-8 py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          All Mirrors
        </Link>

        {/* Step indicator */}
        {step !== "complete" && (
          <div className="flex items-center justify-center gap-8 mb-10">
            {(["input", "edit", "publish"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step === s
                      ? "bg-accent text-[var(--color-on-accent)]"
                      : ["input", "edit", "publish"].indexOf(step) > i
                        ? "bg-accent/20 text-accent"
                        : "bg-gray-3 text-gray-7"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`text-sm ${
                    step === s ? "text-gray-12 font-medium" : "text-gray-7"
                  }`}
                >
                  {s === "input" ? "City" : s === "edit" ? "Configure" : "Publish"}
                </span>
              </div>
            ))}
          </div>
        )}

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {step === "input" && (
            <CityInput
              onGenerate={generateConfig}
              generating={generating}
              error={error}
            />
          )}

          {step === "edit" && config && (
            <ConfigEditor
              config={config}
              onUpdate={updateConfig}
              validationErrors={validation?.errors ?? []}
              onContinue={goToPublish}
            />
          )}

          {(step === "publish" || step === "complete") && config && (
            <PublishStep
              config={config}
              publishing={publishing}
              error={error}
              createdMirrorId={createdMirrorId}
              creationFeeSol={CREATION_FEE_SOL}
              onPublish={handlePublish}
              onBack={goBackToEdit}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
