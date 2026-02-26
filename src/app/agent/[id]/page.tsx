"use client";

import { useState, useEffect, use } from "react";
import { useChat } from "@ai-sdk/react";
import type { AgentRow } from "@/lib/supabase";
import ChatArea from "@/components/agent/ChatArea";
import AgentProfileSidebar from "@/components/agent/AgentProfileSidebar";
import { Loader2, User, X } from "lucide-react";

export default function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: agentId } = use(params);
  const [agent, setAgent] = useState<AgentRow | null>(null);
  const [loadingAgent, setLoadingAgent] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());

  // Fetch agent details
  useEffect(() => {
    fetch(`/api/agent/${agentId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject("Not found")))
      .then((data) => setAgent(data))
      .catch(() => setAgent(null))
      .finally(() => setLoadingAgent(false));
  }, [agentId]);

  const chat = useChat({
    api: `/api/agent/${agentId}/chat`,
    body: { sessionId },
  });

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
    <div className="h-screen pt-16 flex">
      {/* Chat area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <ChatArea
          messages={chat.messages}
          input={chat.input}
          handleInputChange={chat.handleInputChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
          handleSubmit={chat.handleSubmit}
          status={chat.status}
          agentName={agent.name}
          agentAvatar={agent.avatar_url}
        />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-[380px] shrink-0 border-l border-gray-a3 overflow-y-auto bg-gray-2">
        <AgentProfileSidebar agent={agent} />
      </aside>

      {/* Mobile profile toggle */}
      <button
        onClick={() => setShowProfile(true)}
        className="fixed bottom-20 right-4 lg:hidden w-11 h-11 rounded-full bg-gray-3 border border-gray-a3 flex items-center justify-center shadow-lg z-30"
      >
        <User className="w-5 h-5 text-gray-11" />
      </button>

      {/* Mobile profile drawer */}
      {showProfile && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowProfile(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-[380px] bg-gray-2 overflow-y-auto">
            <button
              onClick={() => setShowProfile(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-4 flex items-center justify-center z-10"
            >
              <X className="w-4 h-4 text-gray-11" />
            </button>
            <AgentProfileSidebar agent={agent} />
          </div>
        </div>
      )}
    </div>
  );
}
