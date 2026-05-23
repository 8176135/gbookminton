ALTER TABLE `transaction` RENAME TO `balanceTransaction`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_balanceTransaction` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`amount` integer NOT NULL,
	`reference` text NOT NULL,
	`type` text NOT NULL,
	`originalTransactionId` text,
	`notes` text,
	`eventSignupId` text,
	`date` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`eventSignupId`) REFERENCES `eventSignup`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_balanceTransaction`("id", "userId", "amount", "reference", "type", "originalTransactionId", "notes", "eventSignupId", "date") SELECT "id", "userId", "amount", "reference", "type", "originalTransactionId", "notes", "eventSignupId", "date" FROM `balanceTransaction`;--> statement-breakpoint
DROP TABLE `balanceTransaction`;--> statement-breakpoint
ALTER TABLE `__new_balanceTransaction` RENAME TO `balanceTransaction`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `event` ADD `visibility` text DEFAULT 'onlyCompany' NOT NULL;--> statement-breakpoint
ALTER TABLE `eventSignup` ADD `paidById` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `user` ADD `invitedById` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `user` ADD `allowedPlusOnes` integer DEFAULT 1 NOT NULL;