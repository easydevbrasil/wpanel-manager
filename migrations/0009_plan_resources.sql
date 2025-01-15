-- Criar tabela de recursos dos planos
CREATE TABLE IF NOT EXISTS "plan_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"value" text NOT NULL,
	"image" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Criar tabela de atribuições de recursos aos planos
CREATE TABLE IF NOT EXISTS "plan_resource_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"resource_id" integer NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"custom_value" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Adicionar foreign keys
DO $$ BEGIN
 ALTER TABLE "plan_resource_assignments" ADD CONSTRAINT "plan_resource_assignments_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "plan_resource_assignments" ADD CONSTRAINT "plan_resource_assignments_resource_id_plan_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "plan_resources"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Inserir alguns recursos padrão
INSERT INTO "plan_resources" (name, value, sort_order) VALUES 
('Usuários', '1', 1),
('Armazenamento', '5GB', 2),
('Suporte', 'Email', 3),
('Relatórios', 'Básicos', 4),
('API Access', 'Limitado', 5),
('Backup', 'Manual', 6),
('SSL Certificate', 'Sim', 7),
('Custom Domain', 'Não', 8),
('Integrações', '5', 9),
('Support Response', '48h', 10);

-- Atribuir recursos aos planos existentes
-- Carbon (id=1)
INSERT INTO "plan_resource_assignments" (plan_id, resource_id, is_enabled, custom_value) VALUES 
(1, 1, true, '1'),    -- 1 usuário
(1, 2, true, '5GB'),  -- 5GB armazenamento
(1, 3, true, 'Email'), -- Suporte por email
(1, 7, true, 'Sim'),  -- SSL
(1, 8, false, 'Não'); -- Sem custom domain

-- Bronze (id=2)
INSERT INTO "plan_resource_assignments" (plan_id, resource_id, is_enabled, custom_value) VALUES 
(2, 1, true, '5'),     -- 5 usuários
(2, 2, true, '50GB'),  -- 50GB armazenamento
(2, 3, true, 'Email + Chat'), -- Suporte melhorado
(2, 4, true, 'Básicos'), -- Relatórios básicos
(2, 7, true, 'Sim'),   -- SSL
(2, 8, true, '1'),     -- 1 custom domain
(2, 9, true, '10'),    -- 10 integrações
(2, 10, true, '24h');  -- Response em 24h

-- Silver (id=3)
INSERT INTO "plan_resource_assignments" (plan_id, resource_id, is_enabled, custom_value) VALUES 
(3, 1, true, '10'),    -- 10 usuários
(3, 2, true, '100GB'), -- 100GB armazenamento
(3, 3, true, 'Prioritário'), -- Suporte prioritário
(3, 4, true, 'Avançados'), -- Relatórios avançados
(3, 5, true, 'Completo'), -- API completa
(3, 7, true, 'Sim'),   -- SSL
(3, 8, true, '3'),     -- 3 custom domains
(3, 9, true, '25'),    -- 25 integrações
(3, 10, true, '12h');  -- Response em 12h

-- Gold (id=4)
INSERT INTO "plan_resource_assignments" (plan_id, resource_id, is_enabled, custom_value) VALUES 
(4, 1, true, '25'),    -- 25 usuários
(4, 2, true, '500GB'), -- 500GB armazenamento
(4, 3, true, '24/7'),  -- Suporte 24/7
(4, 4, true, 'Completos'), -- Relatórios completos
(4, 5, true, 'Ilimitado'), -- API ilimitada
(4, 6, true, 'Automático'), -- Backup automático
(4, 7, true, 'Sim'),   -- SSL
(4, 8, true, '10'),    -- 10 custom domains
(4, 9, true, '50'),    -- 50 integrações
(4, 10, true, '6h');   -- Response em 6h

-- Platinum (id=5)
INSERT INTO "plan_resource_assignments" (plan_id, resource_id, is_enabled, custom_value) VALUES 
(5, 1, true, 'Ilimitados'), -- Usuários ilimitados
(5, 2, true, '2TB'),   -- 2TB armazenamento
(5, 3, true, 'Dedicado'), -- Suporte dedicado
(5, 4, true, 'Personalizados'), -- Relatórios personalizados
(5, 5, true, 'Ilimitado'), -- API ilimitada
(5, 6, true, 'Automático'), -- Backup automático
(5, 7, true, 'Sim'),   -- SSL
(5, 8, true, 'Ilimitados'), -- Custom domains ilimitados
(5, 9, true, 'Ilimitadas'), -- Integrações ilimitadas
(5, 10, true, '2h');   -- Response em 2h

-- Diamond (id=6)
INSERT INTO "plan_resource_assignments" (plan_id, resource_id, is_enabled, custom_value) VALUES 
(6, 1, true, 'Ilimitados'), -- Usuários ilimitados
(6, 2, true, 'Ilimitado'), -- Armazenamento ilimitado
(6, 3, true, 'White Glove'), -- Suporte premium
(6, 4, true, 'Enterprise'), -- Relatórios enterprise
(6, 5, true, 'Ilimitado'), -- API ilimitada
(6, 6, true, 'Tempo Real'), -- Backup em tempo real
(6, 7, true, 'Sim'),   -- SSL
(6, 8, true, 'Ilimitados'), -- Custom domains ilimitados
(6, 9, true, 'Ilimitadas'), -- Integrações ilimitadas
(6, 10, true, '1h');   -- Response em 1h