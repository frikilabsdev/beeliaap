-- Linktree Beelia - Supabase SQL Schema

-- 1. General Configuration
CREATE TABLE config (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  site_name TEXT DEFAULT 'Beelia',
  site_description TEXT DEFAULT 'Joyas que cuentan tu historia',
  social_handle TEXT DEFAULT '@beelia.shop',
  profile_image_url TEXT,
  header_image_url TEXT,
  vcard_url TEXT,
  primary_color TEXT DEFAULT '#D4AF37', -- Gold
  secondary_color TEXT DEFAULT '#111111', -- Obsidian
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial config
INSERT INTO config (site_name, site_description, social_handle, primary_color)
VALUES ('Beelia', 'Joyas que cuentan tu historia. Descubre nuestra colección exclusiva.', '@beelia.shop', '#D4AF37');

-- 2. Links
CREATE TABLE links (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_name TEXT, -- Lucide icon name
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  click_count INT DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Promotions
CREATE TABLE promotions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  external_link TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Push Devices
CREATE TABLE push_devices (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  subscription_token JSONB UNIQUE NOT NULL, -- Full FCM/WebPush subscription object
  device_type TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Notification Log
CREATE TABLE notification_log (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_url TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  error_message TEXT
);

-- RLS (Row Level Security) - Basic configuration
-- For this simple project, we'll allow public read access to config, links, and promotions.
-- Mutations should be protected by Supabase Auth (Admin).

ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read config" ON config FOR SELECT USING (true);
CREATE POLICY "Public read links" ON links FOR SELECT WHERE (is_active = true);
CREATE POLICY "Public read promotions" ON promotions FOR SELECT WHERE (is_active = true AND (end_date IS NULL OR end_date > NOW()));
