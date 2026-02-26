"use client";

import { Trash2 } from "lucide-react";
import type { CalendarEvent } from "@/lib/mirrors/types";

interface EventEditorProps {
  event: CalendarEvent;
  onChange: (event: CalendarEvent) => void;
  onRemove: () => void;
}

export default function EventEditor({
  event,
  onChange,
  onRemove,
}: EventEditorProps) {
  return (
    <div className="bg-gray-3 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={event.name}
          onChange={(e) => onChange({ ...event, name: e.target.value })}
          placeholder="Event name"
          className="flex-1 bg-transparent text-sm font-medium text-gray-12 placeholder:text-gray-7 focus:outline-none"
        />
        <button
          onClick={onRemove}
          className="text-gray-7 hover:text-red-400 transition-colors p-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="text-[10px] text-gray-7">Start Month</label>
          <input
            type="number"
            min={1}
            max={12}
            value={event.startMonth}
            onChange={(e) =>
              onChange({ ...event, startMonth: parseInt(e.target.value) || 1 })
            }
            className="w-full bg-gray-2 border border-gray-a3 rounded px-2 py-1 text-xs text-gray-12 focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-7">Start Day</label>
          <input
            type="number"
            min={1}
            max={31}
            value={event.startDay}
            onChange={(e) =>
              onChange({ ...event, startDay: parseInt(e.target.value) || 1 })
            }
            className="w-full bg-gray-2 border border-gray-a3 rounded px-2 py-1 text-xs text-gray-12 focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-7">End Month</label>
          <input
            type="number"
            min={1}
            max={12}
            value={event.endMonth}
            onChange={(e) =>
              onChange({ ...event, endMonth: parseInt(e.target.value) || 1 })
            }
            className="w-full bg-gray-2 border border-gray-a3 rounded px-2 py-1 text-xs text-gray-12 focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-7">End Day</label>
          <input
            type="number"
            min={1}
            max={31}
            value={event.endDay}
            onChange={(e) =>
              onChange({ ...event, endDay: parseInt(e.target.value) || 1 })
            }
            className="w-full bg-gray-2 border border-gray-a3 rounded px-2 py-1 text-xs text-gray-12 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      <input
        type="text"
        value={event.description}
        onChange={(e) => onChange({ ...event, description: e.target.value })}
        placeholder="Brief description"
        className="w-full bg-gray-2 border border-gray-a3 rounded px-2 py-1.5 text-xs text-gray-12 placeholder:text-gray-7 focus:outline-none focus:border-accent"
      />

      <textarea
        value={event.visualImpact}
        onChange={(e) => onChange({ ...event, visualImpact: e.target.value })}
        placeholder="How should this event look in the artwork?"
        rows={2}
        className="w-full bg-gray-2 border border-gray-a3 rounded px-2 py-1.5 text-xs text-gray-12 placeholder:text-gray-7 focus:outline-none focus:border-accent resize-none"
      />
    </div>
  );
}
