-- Adicionar campo planId à tabela clients
ALTER TABLE clients ADD COLUMN plan_id INTEGER REFERENCES plans(id);

-- Criar tabela de planos
CREATE TABLE IF NOT EXISTS "plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"currency" text DEFAULT 'BRL' NOT NULL,
	"billing_period" text DEFAULT 'monthly' NOT NULL,
	"features" jsonb,
	"limitations" jsonb,
	"color" text DEFAULT '#6b7280' NOT NULL,
	"gradient" text DEFAULT 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Criar tabela de descontos por método de pagamento
CREATE TABLE IF NOT EXISTS "plan_payment_discounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"payment_method" text NOT NULL,
	"discount_type" text DEFAULT 'percentage' NOT NULL,
	"discount_value" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Criar tabela de descontos por período de assinatura
CREATE TABLE IF NOT EXISTS "plan_subscription_discounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"subscription_period" text NOT NULL,
	"discount_type" text DEFAULT 'percentage' NOT NULL,
	"discount_value" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Adicionar foreign keys
DO $$ BEGIN
 ALTER TABLE "plan_payment_discounts" ADD CONSTRAINT "plan_payment_discounts_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "plan_subscription_discounts" ADD CONSTRAINT "plan_subscription_discounts_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Inserir planos padrão
INSERT INTO "plans" (name, description, price, color, gradient, features, is_default, sort_order) VALUES 
('Carbon', 'Plano básico com recursos essenciais', 0.00, '#1f2937', 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', 
 '["Recursos básicos", "Suporte por email", "1 usuário", "5GB de armazenamento"]'::jsonb, true, 1),
('Bronze', 'Plano intermediário para pequenas empresas', 29.90, '#8b5a2b', 'linear-gradient(135deg, #cd7f32 0%, #8b5a2b 100%)', 
 '["Todos os recursos do Carbon", "Suporte prioritário", "5 usuários", "50GB de armazenamento", "Relatórios básicos"]'::jsonb, false, 2),
('Silver', 'Plano avançado com mais recursos', 59.90, '#9ca3af', 'linear-gradient(135deg, #c0c0c0 0%, #9ca3af 100%)', 
 '["Todos os recursos do Bronze", "10 usuários", "100GB de armazenamento", "Relatórios avançados", "Integrações API"]'::jsonb, false, 3),
('Gold', 'Plano premium para empresas em crescimento', 99.90, '#fbbf24', 'linear-gradient(135deg, #ffd700 0%, #fbbf24 100%)', 
 '["Todos os recursos do Silver", "25 usuários", "500GB de armazenamento", "Suporte 24/7", "Backup automático"]'::jsonb, false, 4),
('Platinum', 'Plano enterprise com recursos ilimitados', 199.90, '#e5e7eb', 'linear-gradient(135deg, #f7fafc 0%, #e5e7eb 100%)', 
 '["Todos os recursos do Gold", "Usuários ilimitados", "2TB de armazenamento", "Suporte dedicado", "Customizações avançadas"]'::jsonb, false, 5),
('Diamond', 'Plano exclusivo para grandes corporações', 399.90, '#3b82f6', 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', 
 '["Todos os recursos do Platinum", "Armazenamento ilimitado", "SLA garantido", "Consultoria personalizada", "Desenvolvimento sob demanda"]'::jsonb, false, 6);

-- Inserir descontos por método de pagamento (exemplo)
INSERT INTO "plan_payment_discounts" (plan_id, payment_method, discount_type, discount_value) VALUES 
(2, 'PIX', 'percentage', 10.00),
(3, 'PIX', 'percentage', 10.00),
(4, 'PIX', 'percentage', 10.00),
(5, 'PIX', 'percentage', 10.00),
(6, 'PIX', 'percentage', 10.00),
(2, 'boleto', 'percentage', 5.00),
(3, 'boleto', 'percentage', 5.00),
(4, 'boleto', 'percentage', 5.00),
(5, 'boleto', 'percentage', 5.00),
(6, 'boleto', 'percentage', 5.00);

-- Inserir descontos por período de assinatura
INSERT INTO "plan_subscription_discounts" (plan_id, subscription_period, discount_type, discount_value) VALUES 
(2, '6_months', 'percentage', 10.00),
(2, '12_months', 'percentage', 20.00),
(3, '6_months', 'percentage', 10.00),
(3, '12_months', 'percentage', 20.00),
(4, '6_months', 'percentage', 15.00),
(4, '12_months', 'percentage', 25.00),
(5, '6_months', 'percentage', 15.00),
(5, '12_months', 'percentage', 25.00),
(6, '6_months', 'percentage', 20.00),
(6, '12_months', 'percentage', 30.00);