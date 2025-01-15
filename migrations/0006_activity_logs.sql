CREATE TABLE IF NOT EXISTS "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"level" text NOT NULL,
	"category" text NOT NULL,
	"message" text NOT NULL,
	"details" jsonb,
	"user_id" integer,
	"user_email" text,
	"ip_address" text,
	"user_agent" text,
	"action" text,
	"resource" text,
	"resource_id" text,
	"created_at" timestamp DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "activity_logs_timestamp_idx" ON "activity_logs" ("timestamp");
CREATE INDEX IF NOT EXISTS "activity_logs_level_idx" ON "activity_logs" ("level");
CREATE INDEX IF NOT EXISTS "activity_logs_category_idx" ON "activity_logs" ("category");
CREATE INDEX IF NOT EXISTS "activity_logs_user_id_idx" ON "activity_logs" ("user_id");

-- Insert some sample log entries
INSERT INTO "activity_logs" ("level", "category", "message", "user_email", "ip_address", "action", "resource") VALUES
('info', 'system', 'Sistema de logs de atividades inicializado', 'system@wpanel', '127.0.0.1', 'CREATE', 'activity_logs'),
('success', 'authentication', 'Usuário admin logou no sistema', 'admin@wpanel', '127.0.0.1', 'LOGIN', 'user'),
('warning', 'docker', 'Container nginx reiniciado automaticamente', 'system@wpanel', '127.0.0.1', 'RESTART', 'docker_container'),
('error', 'database', 'Falha na conexão com a base de dados PostgreSQL', 'system@wpanel', '127.0.0.1', 'CONNECTION_ERROR', 'database'),
('info', 'user', 'Novo produto cadastrado no sistema', 'admin@wpanel', '127.0.0.1', 'CREATE', 'product'),
('security', 'authentication', 'Tentativa de login com credenciais inválidas', null, '192.168.1.100', 'FAILED_LOGIN', 'user'),
('success', 'system', 'Backup automático realizado com sucesso', 'system@wpanel', '127.0.0.1', 'BACKUP', 'system'),
('warning', 'api', 'Rate limit atingido para IP 192.168.1.50', null, '192.168.1.50', 'RATE_LIMIT', 'api'),
('info', 'docker', 'Novo container MySQL criado', 'admin@wpanel', '127.0.0.1', 'CREATE', 'docker_container'),
('error', 'firewall', 'Regra de firewall rejeitou conexão suspeita', 'system@wpanel', '127.0.0.1', 'BLOCK', 'connection');