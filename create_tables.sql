-- Create partners table
CREATE TABLE IF NOT EXISTS partners (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    unique_code VARCHAR(10) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    total_clicks INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    whatsapp_clicks INTEGER DEFAULT 0,
    telegram_clicks INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for partners table
CREATE INDEX IF NOT EXISTS idx_partners_telegram_id ON partners(telegram_id);
CREATE INDEX IF NOT EXISTS idx_partners_unique_code ON partners(unique_code);
CREATE INDEX IF NOT EXISTS idx_partners_is_active ON partners(is_active);

-- Create clicks table
CREATE TABLE IF NOT EXISTS clicks (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES partners(id),
    ip_address VARCHAR(255) NOT NULL,
    ip_hash VARCHAR(255),
    user_agent TEXT,
    device_type VARCHAR(255),
    browser VARCHAR(255),
    os VARCHAR(255),
    referer TEXT,
    country VARCHAR(255),
    region VARCHAR(255),
    city VARCHAR(255),
    timezone VARCHAR(255),
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_term VARCHAR(255),
    utm_content VARCHAR(255),
    redirect_type VARCHAR(20) CHECK (redirect_type IN ('whatsapp', 'telegram', 'landing')),
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255),
    is_unique BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for clicks table
CREATE INDEX IF NOT EXISTS idx_clicks_partner_id ON clicks(partner_id);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_clicks_ip_hash ON clicks(ip_hash);
CREATE INDEX IF NOT EXISTS idx_clicks_redirect_type ON clicks(redirect_type);
CREATE INDEX IF NOT EXISTS idx_clicks_geo ON clicks(country, city);
CREATE INDEX IF NOT EXISTS idx_clicks_utm ON clicks(utm_source, utm_medium, utm_campaign);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    type VARCHAR(50) DEFAULT 'string',
    category VARCHAR(100),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_by INTEGER REFERENCES admins(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for settings
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

-- Add trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings if they don't exist
INSERT INTO settings (key, value, type, category, is_public) VALUES
    ('welcome_message', 'Добро пожаловать в систему партнеров аренды транспорта!', 'string', 'messages', true),
    ('landing_title', 'Аренда транспорта', 'string', 'landing', true),
    ('landing_subtitle', 'Свяжитесь с нами удобным способом', 'string', 'landing', true),
    ('whatsapp_message', 'Здравствуйте! Я пришел от партнера. Интересует аренда транспорта.', 'string', 'messages', true),
    ('telegram_message', 'Здравствуйте! Я пришел от партнера. Интересует аренда транспорта.', 'string', 'messages', true),
    ('tracking_enabled', 'true', 'boolean', 'system', false),
    ('analytics_retention_days', '90', 'number', 'system', false)
ON CONFLICT (key) DO NOTHING;

-- Grant permissions (adjust username as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;