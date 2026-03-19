CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_id` text NOT NULL,
	`password` text,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `account_provider_provider_id_unique_idx` ON `account` (`provider`,`provider_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`user_agent` text,
	`ip_address` text,
	`location` text,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `tweet` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`text` text NOT NULL,
	`reply_to_tweet_id` text,
	`quoted_tweet_id` text,
	`views` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`reply_to_tweet_id`) REFERENCES `tweet`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`quoted_tweet_id`) REFERENCES `tweet`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tweet_user_timeline_idx` ON `tweet` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `tweet_reply_sort_idx` ON `tweet` (`reply_to_tweet_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `tweet_quoted_tweet_id_idx` ON `tweet` (`quoted_tweet_id`);--> statement-breakpoint
CREATE TABLE `tweet_interaction` (
	`tweet_id` text NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	PRIMARY KEY(`tweet_id`, `user_id`, `type`),
	FOREIGN KEY (`tweet_id`) REFERENCES `tweet`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tweet_interaction_user_type_created_idx` ON `tweet_interaction` (`user_id`,`type`,`created_at`);--> statement-breakpoint
CREATE INDEX `tweet_interaction_tweet_type_idx` ON `tweet_interaction` (`tweet_id`,`type`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer NOT NULL,
	`display_verified_email` integer DEFAULT false NOT NULL,
	`dob` integer,
	`photo` text,
	`cover_image` text,
	`location` text,
	`bio` text,
	`website` text,
	`profile_verified` integer DEFAULT false NOT NULL,
	`onboarding_steps_completed` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `user_follow` (
	`follower_id` text NOT NULL,
	`following_id` text NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	PRIMARY KEY(`follower_id`, `following_id`),
	FOREIGN KEY (`follower_id`) REFERENCES `user`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`following_id`) REFERENCES `user`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_follow_following_id_idx` ON `user_follow` (`following_id`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verification_identifier_unique` ON `verification` (`identifier`);
--> statement-breakpoint
CREATE VIRTUAL TABLE user_search USING fts5(
  user_id UNINDEXED,
  name,
  username,
  tokenize = 'unicode61 remove_diacritics 2'
);
--> statement-breakpoint
CREATE TRIGGER user_ai AFTER INSERT ON user BEGIN
  INSERT INTO user_search(user_id, name, username)
  VALUES (new.id, new.name, new.username);
END
--> statement-breakpoint
CREATE TRIGGER user_ad AFTER DELETE ON user BEGIN
  DELETE FROM user_search
  WHERE user_id = old.id;
END
--> statement-breakpoint
CREATE TRIGGER user_au AFTER UPDATE ON user BEGIN
  UPDATE user_search
  SET name = new.name,
      username = new.username
  WHERE user_id = old.id;
END