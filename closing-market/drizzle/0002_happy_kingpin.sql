CREATE TABLE `seller_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sellerType` enum('closing_soon','closed','relocating','inventory','transfer') NOT NULL,
	`businessNumber` varchar(20) NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`representativeName` varchar(100) NOT NULL,
	`businessCertUrl` text NOT NULL,
	`businessPhotoUrl` text,
	`status` enum('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`reviewedAt` timestamp,
	`reviewedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seller_applications_id` PRIMARY KEY(`id`)
);
