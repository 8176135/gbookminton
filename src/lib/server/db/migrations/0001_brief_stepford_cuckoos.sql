ALTER TABLE `user` ADD `adminDeadlineDays` integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `adminDeadlineTime` text DEFAULT '17:00' NOT NULL;