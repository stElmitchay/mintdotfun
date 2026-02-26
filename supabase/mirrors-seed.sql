-- Seed initial mirror types
-- Run after mirrors-schema.sql

INSERT INTO mirror_types (id, name, config, is_active)
VALUES
  ('dubai', 'Dubai Mirror', '{
    "name": "Dubai Mirror",
    "tagline": "Where desert meets tomorrow",
    "description": "A living canvas that evolves daily, reflecting Dubai''s intersection of ancient desert culture and ultra-modern ambition through weather, markets, news, and cultural events.",
    "mintPriceSol": 0.5,
    "maxSupply": 100,
    "updateCadenceHours": 24
  }'::jsonb, true),
  ('lagos', 'Lagos Pulse', '{
    "name": "Lagos Pulse",
    "tagline": "The heartbeat of Afrofuturism",
    "description": "Lagos in living color — Afrobeats energy, Nollywood drama, and tech-hub hustle rendered as evolving digital art.",
    "mintPriceSol": 0.3,
    "maxSupply": 200,
    "updateCadenceHours": 24
  }'::jsonb, true),
  ('tokyo', 'Tokyo Neon', '{
    "name": "Tokyo Neon",
    "tagline": "Neon dreams, ancient roots",
    "description": "The electric pulse of Shibuya collides with Shinto serenity — a mirror that shifts between chaos and calm with Tokyo''s rhythm.",
    "mintPriceSol": 0.5,
    "maxSupply": 100,
    "updateCadenceHours": 24
  }'::jsonb, true),
  ('solana', 'Solana Pulse', '{
    "name": "Solana Pulse",
    "tagline": "The chain, visualized",
    "description": "Pure on-chain data transformed into abstract art — TPS, validator count, DeFi flows, and governance votes as living geometry.",
    "mintPriceSol": 0.25,
    "maxSupply": 500,
    "updateCadenceHours": 12
  }'::jsonb, true),
  ('newyork', 'New York Rhythm', '{
    "name": "New York Rhythm",
    "tagline": "The city that never sleeps, painted daily",
    "description": "Wall Street to Broadway, subway to skyline — New York''s relentless energy captured in evolving urban art.",
    "mintPriceSol": 0.5,
    "maxSupply": 100,
    "updateCadenceHours": 24
  }'::jsonb, true)
ON CONFLICT (id) DO NOTHING;
