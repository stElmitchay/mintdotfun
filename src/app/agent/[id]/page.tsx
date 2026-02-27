"use client";

import { useState, useEffect, use, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import type { AgentRow } from "@/lib/supabase";
import ChatArea from "@/components/agent/ChatArea";
import { Loader2 } from "lucide-react";
import type { UIMessage, Attachment } from "@ai-sdk/ui-utils";

interface SessionSummary {
  sessionId: string;
  lastMessageAt: string;
  preview: string;
  messageCount: number;
}

export default function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: agentId } = use(params);
  const [agent, setAgent] = useState<AgentRow | null>(null);
  const [loadingAgent, setLoadingAgent] = useState(true);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [capabilities, setCapabilities] = useState<{
    totalTools: number;
    solanaToolsCount: number;
    tools: string[];
    solanaDiagnostics?: { selected: string[]; raw: string[] };
  } | null>(null);
  // Fetch agent details
  useEffect(() => {
    fetch(`/api/agent/${agentId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject("Not found")))
      .then((data) => setAgent(data))
      .catch(() => setAgent(null))
      .finally(() => setLoadingAgent(false));
  }, [agentId]);

  useEffect(() => {
    fetch(`/api/agent/${agentId}/capabilities`)
      .then((r) => (r.ok ? r.json() : Promise.reject("No capabilities")))
      .then((data) =>
        setCapabilities({
          totalTools: Number(data.totalTools ?? 0),
          solanaToolsCount: Number(data.solanaToolsCount ?? 0),
          tools: Array.isArray(data.tools) ? data.tools : [],
          solanaDiagnostics:
            data && typeof data === "object" && "solanaDiagnostics" in data
              ? (data.solanaDiagnostics as { selected: string[]; raw: string[] })
              : undefined,
        })
      )
      .catch(() => setCapabilities(null));
  }, [agentId]);

  useEffect(() => {
    fetch(`/api/agent/${agentId}/sessions`)
      .then((r) => (r.ok ? r.json() : Promise.reject("No sessions")))
      .then((data) => {
        const items = Array.isArray(data.sessions) ? (data.sessions as SessionSummary[]) : [];
        setSessions(items);
        setActiveSessionId((prev) => {
          if (prev) return prev;
          return items[0]?.sessionId ?? crypto.randomUUID();
        });
      })
      .catch(() => {
        setSessions([]);
        setActiveSessionId((prev) => prev || crypto.randomUUID());
      });
  }, [agentId]);

  const chat = useChat({
    api: `/api/agent/${agentId}/chat`,
    body: { sessionId: activeSessionId },
    streamProtocol: "text",
    fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await fetch(input, { ...init, credentials: "include" });
      const contentType = res.headers.get("content-type") ?? "";
      const looksLikeStream =
        contentType.includes("text/plain") ||
        contentType.includes("text/event-stream") ||
        contentType.includes("application/x-ndjson");

      if (!res.ok || !looksLikeStream) {
        let message = `Chat request failed (${res.status})`;
        try {
          const data = await res.clone().json();
          if (data?.error && typeof data.error === "string") {
            message = data.error;
          }
        } catch {
          const text = await res.clone().text().catch(() => "");
          if (text) message = text.slice(0, 300);
        }
        throw new Error(message);
      }

      return res;
    }) as typeof fetch,
    onFinish: () => {
      fetch(`/api/agent/${agentId}/sessions`)
        .then((r) => (r.ok ? r.json() : Promise.reject("No sessions")))
        .then((data) => {
          const items = Array.isArray(data.sessions)
            ? (data.sessions as SessionSummary[])
            : [];
          setSessions(items);
        })
        .catch(() => {});
    },
  });
  const setMessagesRef = useRef(chat.setMessages);
  useEffect(() => {
    setMessagesRef.current = chat.setMessages;
  }, [chat.setMessages]);

  useEffect(() => {
    if (!activeSessionId) return;
    fetch(`/api/agent/${agentId}/messages?sessionId=${encodeURIComponent(activeSessionId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject("No messages")))
      .then((data) => {
        const messages = Array.isArray(data.messages)
          ? (data.messages as UIMessage[])
          : [];
        setMessagesRef.current(messages);
      })
      .catch(() => setMessagesRef.current([]));
  }, [agentId, activeSessionId]);

  const startNewSession = () => {
    const nextId = crypto.randomUUID();
    setActiveSessionId(nextId);
    chat.setMessages([]);
    chat.setInput("");
  };

  const submitWithAttachments = (
    event?: { preventDefault?: () => void },
    attachments?: Attachment[]
  ) => {
    chat.handleSubmit(event, attachments ? { experimental_attachments: attachments } : undefined);
  };

  if (loadingAgent) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 text-gray-8 animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-9">Agent not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen min-h-0 bg-[#0f1014] pt-20 text-[#f4f4f5]">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ChatArea
          messages={chat.messages}
          input={chat.input}
          handleInputChange={chat.handleInputChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
          handleSubmit={submitWithAttachments}
          status={chat.status}
          errorMessage={(chat as { error?: Error | null }).error?.message ?? null}
          agentName={agent.name}
          agentAvatar={agent.avatar_url}
          capabilities={capabilities}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onNewSession={startNewSession}
          agentId={agent.id}
          agentMintAddress={agent.mint_address}
        />
      </div>
    </div>
  );
}
