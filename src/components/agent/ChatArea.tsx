"use client";

import { useRef, useEffect, useState } from "react";
import type { Attachment, UIMessage } from "@ai-sdk/ui-utils";
import { ImagePlus, Send } from "lucide-react";
import MessageBubble from "./MessageBubble";
import Link from "next/link";

interface CapabilityState {
  totalTools: number;
  solanaToolsCount: number;
  tools: string[];
  solanaDiagnostics?: { selected: string[]; raw: string[] };
}

interface ChatAreaProps {
  messages: UIMessage[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (
    e?: { preventDefault?: () => void },
    attachments?: Attachment[]
  ) => void;
  status: "submitted" | "streaming" | "ready" | "error";
  errorMessage?: string | null;
  agentName?: string;
  agentAvatar?: string | null;
  capabilities?: CapabilityState | null;
  sessions: Array<{
    sessionId: string;
    lastMessageAt: string;
    preview: string;
    messageCount: number;
  }>;
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  agentId?: string;
  agentMintAddress?: string;
}

export default function ChatArea({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  status,
  errorMessage,
  agentName,
  agentAvatar,
  capabilities,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  agentId,
  agentMintAddress,
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isStreaming = status === "streaming" || status === "submitted";
  const isEmpty = messages.length === 0;
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const quickPrompts = [
    "Give me an agent strategy for momentum trading on Solana.",
    "Check my wallet balances and summarize risk exposure.",
    "Propose a safer entry plan for JUP this week.",
    "Scan trending tokens and rank by liquidity quality.",
  ];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((input.trim() || pendingAttachments.length > 0) && !isStreaming) {
        handleSubmit(
          e,
          pendingAttachments.length > 0 ? pendingAttachments : undefined
        );
        setPendingAttachments([]);
      }
    }
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length === 0) return;
    const converted = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        contentType: file.type,
        url: await fileToDataUrl(file),
      }))
    );
    setPendingAttachments((prev) => [...prev, ...converted]);
    e.target.value = "";
  };

  const removePendingFile = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0a0b10]">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-8">
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <div className="flex items-center gap-2">
            <select
              value={activeSessionId}
              onChange={(e) => onSelectSession(e.target.value)}
              className="max-w-[70%] rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-200"
            >
              {sessions.length === 0 && (
                <option value={activeSessionId || ""}>Current chat</option>
              )}
              {sessions.map((session) => (
                <option key={session.sessionId} value={session.sessionId}>
                  {new Date(session.lastMessageAt).toLocaleString()} ·{" "}
                  {(session.preview || "Chat").slice(0, 36)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onNewSession}
              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-200 hover:bg-white/10"
            >
              New chat
            </button>
            {agentId && (
              <Link
                href={`/agent/${agentId}/info`}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-200 hover:bg-white/10"
              >
                Agent info
              </Link>
            )}
            {agentMintAddress && (
              <Link
                href={`/nft/${agentMintAddress}`}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-200 hover:bg-white/10"
              >
                List agent
              </Link>
            )}
          </div>

          {capabilities && capabilities.solanaToolsCount === 0 && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Solana tools unavailable in runtime. Loaded: {capabilities.totalTools} tools ({capabilities.tools.join(", ")}).
            </div>
          )}

          {isEmpty && (
            <div className="flex h-[65vh] flex-col items-center justify-center gap-6 text-center">
              <div className="h-14 w-14 overflow-hidden rounded-full border border-violet-300/30 bg-violet-500/20 shadow-[0_0_40px_rgba(168,85,247,0.45)]">
                {agentAvatar ? (
                  <img
                    src={agentAvatar}
                    alt={agentName || "Agent"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-violet-500/35 to-fuchsia-500/35" />
                )}
              </div>
              <h2 className="text-4xl font-semibold leading-tight text-zinc-100">
                Good Evening
                <br />
                What&apos;s on your <span className="text-violet-400">mind?</span>
              </h2>
              <div className="w-full rounded-2xl border border-white/10 bg-[#111420]/70 p-3">
                <textarea
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={onKeyDown}
                  placeholder="Ask a question or make a request."
                  rows={3}
                  className="w-full resize-none bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                  disabled={isStreaming}
                />
                <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
                  <p className="text-[11px] text-zinc-500">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if ((!input.trim() && pendingAttachments.length === 0) || isStreaming) return;
                      handleSubmit(
                        e,
                        pendingAttachments.length > 0
                          ? pendingAttachments
                          : undefined
                      );
                      setPendingAttachments([]);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 disabled:opacity-40"
                    disabled={
                      (!input.trim() && pendingAttachments.length === 0) ||
                      isStreaming
                    }
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="w-full">
                <p className="mb-2 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Get started with an example
                </p>
                <div className="grid grid-cols-1 gap-2 text-left sm:grid-cols-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => {
                        if (isStreaming) return;
                        const synthetic = {
                          target: { value: prompt },
                        } as React.ChangeEvent<HTMLTextAreaElement>;
                        handleInputChange(synthetic);
                      }}
                      className="min-h-16 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-zinc-300 hover:bg-white/[0.06]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!isEmpty &&
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                agentName={agentName}
                agentAvatar={agentAvatar}
              />
            ))}

          {/* Streaming indicator */}
          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && !isEmpty && (
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse [animation-delay:150ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse [animation-delay:300ms]" />
            </div>
          )}
          </div>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          handleSubmit(
            e,
            pendingAttachments.length > 0 ? pendingAttachments : undefined
          );
          setPendingAttachments([]);
        }}
        className={`shrink-0 border-t border-white/10 bg-[#0d0f16] px-4 py-3 ${isEmpty ? "hidden" : ""}`}
      >
        {status === "error" && (
          <div className="mx-auto mb-2 max-w-4xl rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {errorMessage || "Agent request failed. Refresh and try again."}
          </div>
        )}
        {pendingAttachments.length > 0 && (
          <div className="mx-auto mb-2 flex max-w-4xl flex-wrap gap-2">
            {pendingAttachments.map((attachment, index) => (
              <button
                key={`${attachment.url}-${index}`}
                type="button"
                onClick={() => removePendingFile(index)}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-300"
              >
                {(attachment.name || "image").slice(0, 40)} ×
              </button>
            ))}
          </div>
        )}
        <div className="mx-auto flex max-w-4xl items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onPickFiles}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-200"
            title="Upload image"
          >
            <ImagePlus className="h-4 w-4" />
          </button>
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            placeholder="Message agent..."
            rows={1}
            className="max-h-40 flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={
              (!input.trim() && pendingAttachments.length === 0) || isStreaming
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 transition-opacity disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
