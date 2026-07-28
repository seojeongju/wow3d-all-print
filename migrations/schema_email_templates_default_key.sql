ALTER TABLE email_templates ADD COLUMN template_key TEXT;
ALTER TABLE email_templates ADD COLUMN is_system INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_templates_store_template_key
ON email_templates(store_id, template_key)
WHERE template_key IS NOT NULL;
