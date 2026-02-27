"use client";

import type { UIMessage } from "@ai-sdk/ui-utils";
import { Bot } from "lucide-react";
import ToolResultCard from "./ToolResultCard";

interface MessageBubbleProps {
  message: UIMessage;
  agentName?: string;
  agentAvatar?: string | null;
}

export default function MessageBubble({ message, agentName, agentAvatar }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const attachments = Array.isArray(message.experimental_attachments)
    ? message.experimental_attachments
    : [];

  return (
    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Agent avatar */}
      {!isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
          {agentAvatar ? (
            <img src={agentAvatar} alt={agentName} className="w-full h-full object-cover" />
          ) : (
            <Bot className="h-4 w-4 text-zinc-400" />
          )}
        </div>
      )}

      <div className={`max-w-[80%] space-y-2 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {/* Agent name label */}
        {!isUser && agentName && (
          <span className="text-[10px] font-medium text-zinc-500">{agentName}</span>
        )}

        {message.parts.map((part, i) => {
          if (part.type === "text" && part.text) {
            return (
              <div
                key={i}
                className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isUser
                    ? "rounded-br-md border border-violet-300/20 bg-violet-500/20 text-violet-50"
                    : "rounded-bl-md border border-white/10 bg-white/[0.03] text-zinc-100"
                }`}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {part.text}
              </div>
            );
          }

          if (part.type === "tool-invocation") {
            return (
              <ToolResultCard
                key={i}
                toolName={part.toolInvocation.toolName}
                state={part.toolInvocation.state}
                result={"result" in part.toolInvocation ? part.toolInvocation.result : undefined}
                args={part.toolInvocation.args as Record<string, unknown>}
              />
            );
          }

          return null;
        })}

        {attachments.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {attachments.map((attachment, index) => {
              const url = attachment.url || "";
              const contentType = attachment.contentType || "";
              const isImage =
                contentType.startsWith("image/") || url.startsWith("data:image");

              if (!isImage) {
                return (
                  <a
                    key={`${url}-${index}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-200"
                  >
                    {attachment.name || "Attachment"}
                  </a>
                );
              }

              return (
                <img
                  key={`${url}-${index}`}
                  src={url}
                  alt={attachment.name || "Attachment"}
                  className="h-28 w-28 rounded-lg border border-white/10 object-cover"
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
