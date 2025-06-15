import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  avatar: text("avatar"),
});

export const navigationItems = pgTable("navigation_items", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  icon: text("icon").notNull(),
  href: text("href"),
  parentId: integer("parent_id"),
  order: integer("order").notNull().default(0),
});

export const dashboardStats = pgTable("dashboard_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  cartCount: integer("cart_count").notNull().default(0),
  notificationCount: integer("notification_count").notNull().default(0),
  emailCount: integer("email_count").notNull().default(0),
  stats: jsonb("stats"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertNavigationItemSchema = createInsertSchema(navigationItems).omit({
  id: true,
});

export const insertDashboardStatsSchema = createInsertSchema(dashboardStats).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type NavigationItem = typeof navigationItems.$inferSelect;
export type DashboardStats = typeof dashboardStats.$inferSelect;
export type InsertNavigationItem = z.infer<typeof insertNavigationItemSchema>;
export type InsertDashboardStats = z.infer<typeof insertDashboardStatsSchema>;
