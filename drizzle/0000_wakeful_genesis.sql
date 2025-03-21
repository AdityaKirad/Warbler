CREATE TABLE `passwords` (
	`hash` text NOT NULL,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `passwords_userId_unique` ON `passwords` (`userId`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`createdAt` DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` DATETIME NOT NULL,
	`expiresAt` DATETIME NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `sessions` (`userId`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`dob` DATETIME NOT NULL,
	`image` text,
	`createdAt` DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` DATETIME NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`target` text NOT NULL,
	`type` text NOT NULL,
	`charSet` text NOT NULL,
	`secret` text NOT NULL,
	`algorithm` text NOT NULL,
	`digits` integer NOT NULL,
	`period` integer NOT NULL,
	`createdAt` DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`expiresAt` DATETIME NOT NULL,
	PRIMARY KEY(`target`, `type`)
);
