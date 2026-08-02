import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const vehicles = sqliteTable("vehicles", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  image: text("image").notNull(),
  year: integer("year").notNull(),
  transmission: text("transmission").notNull(),
  seats: integer("seats").notNull(),
  rate: integer("rate").notNull(),
  deposit: integer("deposit").notNull(),
  plate: text("plate").notNull(),
  tag: text("tag").notNull(),
  status: text("status").notNull().default("Available"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const bookings = sqliteTable("bookings", {
  reference: text("reference").primaryKey(),
  vehicleSlug: text("vehicle_slug").notNull().references(() => vehicles.slug),
  vehicleName: text("vehicle_name").notNull(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  pickupDate: text("pickup_date").notNull(),
  returnDate: text("return_date").notNull(),
  pickupLocation: text("pickup_location").notNull(),
  rentalDays: integer("rental_days").notNull(),
  dailyRate: integer("daily_rate").notNull(),
  deposit: integer("deposit").notNull(),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").notNull().default("Pending"),
  verificationStatus: text("verification_status").notNull().default("Review"),
  licenseObjectKey: text("license_object_key"),
  licenseFileName: text("license_file_name"),
  licenseContentType: text("license_content_type"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("Unread"),
  createdAt: text("created_at").notNull(),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  detail: text("detail"),
  createdAt: text("created_at").notNull(),
});
