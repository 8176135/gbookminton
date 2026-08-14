CREATE TABLE IF NOT EXISTS `changelog` (
	`id` text PRIMARY KEY NOT NULL,
	`tableName` text NOT NULL,
	`recordId` text NOT NULL,
	`action` text NOT NULL,
	`oldData` text,
	`newData` text,
	`timestamp` integer NOT NULL
);
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `user_after_insert` AFTER INSERT ON `user` BEGIN
	INSERT INTO changelog (id, tableName, recordId, action, oldData, newData, timestamp)
	VALUES (
		hex(randomblob(16)),
		'user',
		NEW.id,
		'insert',
		NULL,
		json_object('id', NEW."id", 'name', NEW."name", 'email', NEW."email", 'emailVerified', NEW."emailVerified", 'image', NEW."image", 'createdAt', NEW."createdAt", 'updatedAt', NEW."updatedAt", 'balance', NEW."balance", 'shortCode', NEW."shortCode", 'role', NEW."role", 'accountType', NEW."accountType", 'adminDeadlineDays', NEW."adminDeadlineDays", 'adminDeadlineTime', NEW."adminDeadlineTime", 'invitedById', NEW."invitedById", 'allowedPlusOnes', NEW."allowedPlusOnes"),
		unixepoch() * 1000
	);
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `user_after_update` AFTER UPDATE ON `user` BEGIN
	INSERT INTO changelog (id, tableName, recordId, action, oldData, newData, timestamp)
	VALUES (
		hex(randomblob(16)),
		'user',
		OLD.id,
		'update',
		json_object('id', OLD."id", 'name', OLD."name", 'email', OLD."email", 'emailVerified', OLD."emailVerified", 'image', OLD."image", 'createdAt', OLD."createdAt", 'updatedAt', OLD."updatedAt", 'balance', OLD."balance", 'shortCode', OLD."shortCode", 'role', OLD."role", 'accountType', OLD."accountType", 'adminDeadlineDays', OLD."adminDeadlineDays", 'adminDeadlineTime', OLD."adminDeadlineTime", 'invitedById', OLD."invitedById", 'allowedPlusOnes', OLD."allowedPlusOnes"),
		json_object('id', NEW."id", 'name', NEW."name", 'email', NEW."email", 'emailVerified', NEW."emailVerified", 'image', NEW."image", 'createdAt', NEW."createdAt", 'updatedAt', NEW."updatedAt", 'balance', NEW."balance", 'shortCode', NEW."shortCode", 'role', NEW."role", 'accountType', NEW."accountType", 'adminDeadlineDays', NEW."adminDeadlineDays", 'adminDeadlineTime', NEW."adminDeadlineTime", 'invitedById', NEW."invitedById", 'allowedPlusOnes', NEW."allowedPlusOnes"),
		unixepoch() * 1000
	);
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `user_after_delete` AFTER DELETE ON `user` BEGIN
	INSERT INTO changelog (id, tableName, recordId, action, oldData, newData, timestamp)
	VALUES (
		hex(randomblob(16)),
		'user',
		OLD.id,
		'delete',
		json_object('id', OLD."id", 'name', OLD."name", 'email', OLD."email", 'emailVerified', OLD."emailVerified", 'image', OLD."image", 'createdAt', OLD."createdAt", 'updatedAt', OLD."updatedAt", 'balance', OLD."balance", 'shortCode', OLD."shortCode", 'role', OLD."role", 'accountType', OLD."accountType", 'adminDeadlineDays', OLD."adminDeadlineDays", 'adminDeadlineTime', OLD."adminDeadlineTime", 'invitedById', OLD."invitedById", 'allowedPlusOnes', OLD."allowedPlusOnes"),
		NULL,
		unixepoch() * 1000
	);
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `event_after_insert` AFTER INSERT ON `event` BEGIN
	INSERT INTO changelog (id, tableName, recordId, action, oldData, newData, timestamp)
	VALUES (
		hex(randomblob(16)),
		'event',
		NEW.id,
		'insert',
		NULL,
		json_object('id', NEW."id", 'title', NEW."title", 'date', NEW."date", 'location', NEW."location", 'duration', NEW."duration", 'description', NEW."description", 'capacity', NEW."capacity", 'deadline', NEW."deadline", 'costCompany', NEW."costCompany", 'costPlusOne', NEW."costPlusOne", 'isLocked', NEW."isLocked", 'visibility', NEW."visibility", 'createdAt', NEW."createdAt", 'updatedAt', NEW."updatedAt"),
		unixepoch() * 1000
	);
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `event_after_update` AFTER UPDATE ON `event` BEGIN
	INSERT INTO changelog (id, tableName, recordId, action, oldData, newData, timestamp)
	VALUES (
		hex(randomblob(16)),
		'event',
		OLD.id,
		'update',
		json_object('id', OLD."id", 'title', OLD."title", 'date', OLD."date", 'location', OLD."location", 'duration', OLD."duration", 'description', OLD."description", 'capacity', OLD."capacity", 'deadline', OLD."deadline", 'costCompany', OLD."costCompany", 'costPlusOne', OLD."costPlusOne", 'isLocked', OLD."isLocked", 'visibility', OLD."visibility", 'createdAt', OLD."createdAt", 'updatedAt', OLD."updatedAt"),
		json_object('id', NEW."id", 'title', NEW."title", 'date', NEW."date", 'location', NEW."location", 'duration', NEW."duration", 'description', NEW."description", 'capacity', NEW."capacity", 'deadline', NEW."deadline", 'costCompany', NEW."costCompany", 'costPlusOne', NEW."costPlusOne", 'isLocked', NEW."isLocked", 'visibility', NEW."visibility", 'createdAt', NEW."createdAt", 'updatedAt', NEW."updatedAt"),
		unixepoch() * 1000
	);
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `event_after_delete` AFTER DELETE ON `event` BEGIN
	INSERT INTO changelog (id, tableName, recordId, action, oldData, newData, timestamp)
	VALUES (
		hex(randomblob(16)),
		'event',
		OLD.id,
		'delete',
		json_object('id', OLD."id", 'title', OLD."title", 'date', OLD."date", 'location', OLD."location", 'duration', OLD."duration", 'description', OLD."description", 'capacity', OLD."capacity", 'deadline', OLD."deadline", 'costCompany', OLD."costCompany", 'costPlusOne', OLD."costPlusOne", 'isLocked', OLD."isLocked", 'visibility', OLD."visibility", 'createdAt', OLD."createdAt", 'updatedAt', OLD."updatedAt"),
		NULL,
		unixepoch() * 1000
	);
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `account_after_insert` AFTER INSERT ON `account` BEGIN
	INSERT INTO changelog (id, tableName, recordId, action, oldData, newData, timestamp)
	VALUES (
		hex(randomblob(16)),
		'account',
		NEW.id,
		'insert',
		NULL,
		json_object('id', NEW."id", 'accountId', NEW."accountId", 'providerId', NEW."providerId", 'userId', NEW."userId", 'accessTokenExpiresAt', NEW."accessTokenExpiresAt", 'refreshTokenExpiresAt', NEW."refreshTokenExpiresAt", 'scope', NEW."scope", 'createdAt', NEW."createdAt", 'updatedAt', NEW."updatedAt"),
		unixepoch() * 1000
	);
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `account_after_update` AFTER UPDATE ON `account` BEGIN
	INSERT INTO changelog (id, tableName, recordId, action, oldData, newData, timestamp)
	VALUES (
		hex(randomblob(16)),
		'account',
		OLD.id,
		'update',
		json_object('id', OLD."id", 'accountId', OLD."accountId", 'providerId', OLD."providerId", 'userId', OLD."userId", 'accessTokenExpiresAt', OLD."accessTokenExpiresAt", 'refreshTokenExpiresAt', OLD."refreshTokenExpiresAt", 'scope', OLD."scope", 'createdAt', OLD."createdAt", 'updatedAt', OLD."updatedAt"),
		json_object('id', NEW."id", 'accountId', NEW."accountId", 'providerId', NEW."providerId", 'userId', NEW."userId", 'accessTokenExpiresAt', NEW."accessTokenExpiresAt", 'refreshTokenExpiresAt', NEW."refreshTokenExpiresAt", 'scope', NEW."scope", 'createdAt', NEW."createdAt", 'updatedAt', NEW."updatedAt"),
		unixepoch() * 1000
	);
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `account_after_delete` AFTER DELETE ON `account` BEGIN
	INSERT INTO changelog (id, tableName, recordId, action, oldData, newData, timestamp)
	VALUES (
		hex(randomblob(16)),
		'account',
		OLD.id,
		'delete',
		json_object('id', OLD."id", 'accountId', OLD."accountId", 'providerId', OLD."providerId", 'userId', OLD."userId", 'accessTokenExpiresAt', OLD."accessTokenExpiresAt", 'refreshTokenExpiresAt', OLD."refreshTokenExpiresAt", 'scope', OLD."scope", 'createdAt', OLD."createdAt", 'updatedAt', OLD."updatedAt"),
		NULL,
		unixepoch() * 1000
	);
END;
