CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`detail` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`reference` text PRIMARY KEY NOT NULL,
	`vehicle_slug` text NOT NULL,
	`vehicle_name` text NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`pickup_date` text NOT NULL,
	`return_date` text NOT NULL,
	`pickup_location` text NOT NULL,
	`rental_days` integer NOT NULL,
	`daily_rate` integer NOT NULL,
	`deposit` integer NOT NULL,
	`total_amount` integer NOT NULL,
	`status` text DEFAULT 'Pending' NOT NULL,
	`verification_status` text DEFAULT 'Review' NOT NULL,
	`license_object_key` text,
	`license_file_name` text,
	`license_content_type` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`vehicle_slug`) REFERENCES `vehicles`(`slug`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'Unread' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`image` text NOT NULL,
	`year` integer NOT NULL,
	`transmission` text NOT NULL,
	`seats` integer NOT NULL,
	`rate` integer NOT NULL,
	`deposit` integer NOT NULL,
	`plate` text NOT NULL,
	`tag` text NOT NULL,
	`status` text DEFAULT 'Available' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
