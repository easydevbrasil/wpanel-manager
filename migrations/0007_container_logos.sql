-- Migration: Add container_logos table for persisting Docker container logos
-- Created: 2025-09-18

CREATE TABLE IF NOT EXISTS container_logos (
    id SERIAL PRIMARY KEY,
    container_id TEXT NOT NULL UNIQUE,
    logo_url TEXT NOT NULL,
    original_name TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on container_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_container_logos_container_id ON container_logos(container_id);

-- Insert some sample data for testing (optional)
-- These can be removed in production
INSERT INTO container_logos (container_id, logo_url, original_name) VALUES
('sample_container_001', '/uploads/docker-logo.png', 'nginx_web'),
('sample_container_002', '/uploads/docker-logo.png', 'postgres_db')
ON CONFLICT (container_id) DO NOTHING;