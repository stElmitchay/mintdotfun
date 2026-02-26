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

  return (
    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Agent avatar */}
      {!isUser && (
        <div className="shrink-0 w-7 h-7 rounded-full overflow-hidden bg-gray-4 flex items-center justify-center mt-0.5">
          {agentAvatar ? (
            <img src={agentAvatar} alt={agentName} className="w-full h-full object-cover" />
          ) : (
            <Bot className="w-4 h-4 text-gray-8" />
          )}
        </div>
      )}

      <div className={`max-w-[80%] space-y-2 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {/* Agent name label */}
        {!isUser && agentName && (
          <span className="text-[10px] text-gray-8 font-medium">{agentName}</span>
        )}

        {message.parts.map((part, i) => {
          if (part.type === "text" && part.text) {
            return (
              <div
                key={i}
                className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isUser
                    ? "bg-accent text-[var(--color-on-accent)] rounded-br-md"
                    : "bg-gray-3 text-gray-11 rounded-bl-md"
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
      </div>
    </div>
  );
}
