"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, AlertCircle } from "lucide-react";
import type { MirrorTypeConfig, CalendarEvent } from "@/lib/mirrors/types";
import EventEditor from "./EventEditor";

interface ConfigEditorProps {
  config: MirrorTypeConfig;
  onUpdate: (updates: Partial<MirrorTypeConfig>) => void;
  validationErrors: string[];
  onContinue: () => void;
}

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-a3 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-2 hover:bg-gray-3 transition-colors"
      >
        <span className="text-sm font-medium text-gray-11">{title}</span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-8" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-8" />
        )}
      </button>
      {open && <div className="px-4 py-4 space-y-4">{children}</div>}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-8 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-gray-3 border border-gray-a3 rounded-lg px-3 py-2 text-sm text-gray-12 placeholder:text-gray-7 focus:outline-none focus:border-accent transition-colors"
    />
  );
}

function TextArea({
  value,
  onChange,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full bg-gray-3 border border-gray-a3 rounded-lg px-3 py-2 text-sm text-gray-12 focus:outline-none focus:border-accent transition-colors resize-none"
    />
  );
}

function ListEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            value={item}
            onChange={(e) => {
              const updated = [...items];
              updated[i] = e.target.value;
              onChange(updated);
            }}
            placeholder={placeholder}
            className="flex-1 bg-gray-3 border border-gray-a3 rounded-lg px-3 py-2 text-sm text-gray-12 placeholder:text-gray-7 focus:outline-none focus:border-accent transition-colors"
          />
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="text-gray-7 hover:text-red-400 transition-colors px-2 text-sm"
          >
            x
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ""])}
        className="text-xs text-accent hover:text-accent/80 transition-colors"
      >
        + Add item
      </button>
    </div>
  );
}

export default function ConfigEditor({
  config,
  onUpdate,
  validationErrors,
  onContinue,
}: ConfigEditorProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-medium text-gray-12 mb-1">
          Review & Edit
        </h2>
        <p className="text-sm text-gray-9">
          AI generated this config. Edit any fields before publishing.
        </p>
      </div>

      {validationErrors.length > 0 && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Validation issues</span>
          </div>
          <ul className="text-xs text-red-300 space-y-1">
            {validationErrors.map((err, i) => (
              <li key={i}>- {err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {/* Identity */}
        <Section title="Identity" defaultOpen>
          <Field label="ID (slug)">
            <TextInput
              value={config.id}
              onChange={(id) => onUpdate({ id })}
              placeholder="e.g. seoul"
            />
          </Field>
          <Field label="Name">
            <TextInput
              value={config.name}
              onChange={(name) => onUpdate({ name })}
            />
          </Field>
          <Field label="Tagline">
            <TextInput
              value={config.tagline}
              onChange={(tagline) => onUpdate({ tagline })}
            />
          </Field>
          <Field label="Description">
            <TextArea
              value={config.description}
              onChange={(description) => onUpdate({ description })}
            />
          </Field>
        </Section>

        {/* Location & Data */}
        <Section title="Location & Data Feeds">
          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <TextInput
                value={config.dataFeedConfig.location.city}
                onChange={(city) =>
                  onUpdate({
                    dataFeedConfig: {
                      ...config.dataFeedConfig,
                      location: { ...config.dataFeedConfig.location, city },
                    },
                  })
                }
              />
            </Field>
            <Field label="Country Code">
              <TextInput
                value={config.dataFeedConfig.location.country}
                onChange={(country) =>
                  onUpdate({
                    dataFeedConfig: {
                      ...config.dataFeedConfig,
                      location: { ...config.dataFeedConfig.location, country },
                    },
                  })
                }
              />
            </Field>
            <Field label="Latitude">
              <input
                type="number"
                step="0.0001"
                value={config.dataFeedConfig.location.lat}
                onChange={(e) =>
                  onUpdate({
                    dataFeedConfig: {
                      ...config.dataFeedConfig,
                      location: {
                        ...config.dataFeedConfig.location,
                        lat: parseFloat(e.target.value) || 0,
                      },
                    },
                  })
                }
                className="w-full bg-gray-3 border border-gray-a3 rounded-lg px-3 py-2 text-sm text-gray-12 focus:outline-none focus:border-accent transition-colors"
              />
            </Field>
            <Field label="Longitude">
              <input
                type="number"
                step="0.0001"
                value={config.dataFeedConfig.location.lon}
                onChange={(e) =>
                  onUpdate({
                    dataFeedConfig: {
                      ...config.dataFeedConfig,
                      location: {
                        ...config.dataFeedConfig.location,
                        lon: parseFloat(e.target.value) || 0,
                      },
                    },
                  })
                }
                className="w-full bg-gray-3 border border-gray-a3 rounded-lg px-3 py-2 text-sm text-gray-12 focus:outline-none focus:border-accent transition-colors"
              />
            </Field>
          </div>
          <Field label="News Keywords">
            <ListEditor
              items={config.dataFeedConfig.newsKeywords}
              onChange={(newsKeywords) =>
                onUpdate({
                  dataFeedConfig: { ...config.dataFeedConfig, newsKeywords },
                })
              }
              placeholder="e.g. K-pop"
            />
          </Field>
        </Section>

        {/* Visual Style */}
        <Section title="Visual Style">
          <Field label="Art Style Prompt">
            <TextArea
              value={config.style.basePrompt}
              onChange={(basePrompt) =>
                onUpdate({
                  style: { ...config.style, basePrompt },
                })
              }
              rows={4}
            />
          </Field>
          <Field label="Color Palette Guidelines">
            <TextArea
              value={config.colorPaletteGuidelines}
              onChange={(colorPaletteGuidelines) =>
                onUpdate({ colorPaletteGuidelines })
              }
              rows={3}
            />
          </Field>
        </Section>

        {/* Landmarks & Motifs */}
        <Section title="Landmarks & Cultural Motifs">
          <Field label="Architectural Anchors (always visible in every frame)">
            <ListEditor
              items={config.architecturalAnchors}
              onChange={(architecturalAnchors) =>
                onUpdate({ architecturalAnchors })
              }
              placeholder="e.g. Namsan Tower silhouette"
            />
          </Field>
          <Field label="Cultural Motifs">
            <ListEditor
              items={config.culturalMotifs}
              onChange={(culturalMotifs) => onUpdate({ culturalMotifs })}
              placeholder="e.g. Hanbok fabric patterns"
            />
          </Field>
        </Section>

        {/* Events */}
        <Section title="Cultural Events">
          <div className="space-y-3">
            {config.dataFeedConfig.customEvents.map((event, i) => (
              <EventEditor
                key={i}
                event={event}
                onChange={(updated) => {
                  const events = [...config.dataFeedConfig.customEvents];
                  events[i] = updated;
                  onUpdate({
                    dataFeedConfig: {
                      ...config.dataFeedConfig,
                      customEvents: events,
                    },
                  });
                }}
                onRemove={() => {
                  const events = config.dataFeedConfig.customEvents.filter(
                    (_, j) => j !== i
                  );
                  onUpdate({
                    dataFeedConfig: {
                      ...config.dataFeedConfig,
                      customEvents: events,
                    },
                  });
                }}
              />
            ))}
            <button
              onClick={() => {
                const newEvent: CalendarEvent = {
                  name: "",
                  startMonth: 1,
                  startDay: 1,
                  endMonth: 1,
                  endDay: 1,
                  description: "",
                  visualImpact: "",
                };
                onUpdate({
                  dataFeedConfig: {
                    ...config.dataFeedConfig,
                    customEvents: [
                      ...config.dataFeedConfig.customEvents,
                      newEvent,
                    ],
                  },
                });
              }}
              className="text-xs text-accent hover:text-accent/80 transition-colors"
            >
              + Add Event
            </button>
          </div>
        </Section>

        {/* Economics */}
        <Section title="Economics">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Mint Price (SOL)">
              <input
                type="number"
                step="0.05"
                min="0.01"
                value={config.mintPriceSol}
                onChange={(e) =>
                  onUpdate({
                    mintPriceSol: parseFloat(e.target.value) || 0.5,
                  })
                }
                className="w-full bg-gray-3 border border-gray-a3 rounded-lg px-3 py-2 text-sm text-gray-12 focus:outline-none focus:border-accent transition-colors"
              />
            </Field>
            <Field label="Max Supply">
              <input
                type="number"
                min="10"
                value={config.maxSupply ?? 100}
                onChange={(e) =>
                  onUpdate({
                    maxSupply: parseInt(e.target.value) || 100,
                  })
                }
                className="w-full bg-gray-3 border border-gray-a3 rounded-lg px-3 py-2 text-sm text-gray-12 focus:outline-none focus:border-accent transition-colors"
              />
            </Field>
            <Field label="Update Cadence">
              <select
                value={config.updateCadenceHours}
                onChange={(e) =>
                  onUpdate({
                    updateCadenceHours: parseInt(e.target.value),
                  })
                }
                className="w-full bg-gray-3 border border-gray-a3 rounded-lg px-3 py-2 text-sm text-gray-12 focus:outline-none focus:border-accent transition-colors"
              >
                <option value={12}>Every 12 hours</option>
                <option value={24}>Daily (24h)</option>
                <option value={48}>Every 2 days</option>
              </select>
            </Field>
          </div>
        </Section>
      </div>

      <button
        onClick={onContinue}
        className="mt-6 w-full bg-accent text-[var(--color-on-accent)] py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-all"
      >
        Continue to Publish
      </button>
    </div>
  );
}
