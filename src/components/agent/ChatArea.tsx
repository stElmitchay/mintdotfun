"use client";

import { useRef, useEffect } from "react";
import type { UIMessage } from "@ai-sdk/ui-utils";
import { Send } from "lucide-react";
import MessageBubble from "./MessageBubble";

interface ChatAreaProps {
  messages: UIMessage[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  status: "submitted" | "streaming" | "ready" | "error";
  agentName?: string;
  agentAvatar?: string | null;
}

export default function ChatArea({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  status,
  agentName,
  agentAvatar,
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isStreaming = status === "streaming" || status === "submitted";

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <p className="text-gray-8 text-sm">
              Start a conversation with {agentName || "this agent"}
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            agentName={agentName}
            agentAvatar={agentAvatar}
          />
        ))}
        {/* Streaming indicator */}
        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-1.5 px-4 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse [animation-delay:150ms]" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse [animation-delay:300ms]" />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="shrink-0 border-t border-gray-a3 px-4 py-3">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none bg-gray-3 text-gray-12 text-sm rounded-xl px-4 py-3 placeholder:text-gray-7 focus:outline-none focus:ring-1 focus:ring-accent/40 max-h-32"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="shrink-0 w-10 h-10 rounded-xl bg-accent text-[var(--color-on-accent)] flex items-center justify-center disabled:opacity-40 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
