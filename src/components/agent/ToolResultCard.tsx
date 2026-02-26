"use client";

import { useState } from "react";
import { Image, Brain, ChevronDown, ChevronUp, Wrench } from "lucide-react";

interface ToolResultCardProps {
  toolName: string;
  state: string;
  result?: unknown;
  args?: Record<string, unknown>;
}

export default function ToolResultCard({ toolName, state, result, args }: ToolResultCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (state !== "result") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-3 text-gray-9 text-xs">
        <Wrench className="w-3.5 h-3.5 animate-spin" />
        <span>Using {toolName}...</span>
      </div>
    );
  }

  // generateArt tool result
  if (toolName === "generateArt") {
    const res = result as Record<string, unknown> | undefined;
    const imageUrl = res?.imageUrl as string | undefined;
    const prompt = (args?.prompt as string) || (res?.prompt as string) || "";
    const artworkId = res?.artworkId as string | undefined;

    return (
      <div className="rounded-xl overflow-hidden bg-gray-3 max-w-sm">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={prompt}
            className="w-full aspect-square object-cover animate-in fade-in duration-700"
          />
        ) : (
          <div className="w-full aspect-square bg-gray-4 flex items-center justify-center">
            <Image className="w-8 h-8 text-gray-7" />
          </div>
        )}
        <div className="px-3 py-2.5 space-y-1">
          {prompt && (
            <p className="text-xs text-gray-9 line-clamp-2">{prompt}</p>
          )}
          {artworkId && (
            <p className="text-[10px] text-gray-7 font-mono">{artworkId}</p>
          )}
        </div>
      </div>
    );
  }

  // searchMemory tool result
  if (toolName === "searchMemory") {
    const res = result as Record<string, unknown> | undefined;
    const memories = (res?.memories ?? res?.results ?? []) as Array<{
      content?: string;
      similarity?: number;
    }>;

    return (
      <div className="rounded-lg bg-gray-3 max-w-sm overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-9 hover:text-gray-11 transition-colors"
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Recalled {memories.length} memories</span>
          {expanded ? (
            <ChevronUp className="w-3 h-3 ml-auto" />
          ) : (
            <ChevronDown className="w-3 h-3 ml-auto" />
          )}
        </button>
        {expanded && memories.length > 0 && (
          <div className="px-3 pb-2.5 space-y-1.5">
            {memories.map((m, i) => (
              <div key={i} className="text-xs text-gray-9 flex gap-2">
                <span className="text-gray-7 shrink-0">
                  {m.similarity != null ? `${Math.round(m.similarity * 100)}%` : ""}
                </span>
                <span className="line-clamp-2">{m.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Generic tool result
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-3 text-gray-9 text-xs">
      <Wrench className="w-3.5 h-3.5" />
      <span>{toolName} completed</span>
    </div>
  );
}
