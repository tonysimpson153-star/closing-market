CREATE TABLE `business_transfers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`keyMoney` int,
	`deposit` int,
	`monthlyRent` int,
	`businessType` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_transfers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('demolition','interior','waste','sign','pos','cctv','cleaning','tax','labor') NOT NULL,
	`description` text,
	`phone` varchar(20),
	`kakaoId` varchar(100),
	`address` varchar(500),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`portfolioUrls` text,
	`isAdvertised` boolean NOT NULL DEFAULT false,
	`adExpiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text,
	`imageUrl` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int,
	`buyerId` int NOT NULL,
	`sellerId` int NOT NULL,
	`lastMessage` text,
	`lastMessageAt` timestamp,
	`status` enum('active','completed','cancelled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`parentId` int,
	`content` text NOT NULL,
	`likeCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int,
	`businessId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('chat','favorite','comment','sold','price_change','business_reply','notice') NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text,
	`referenceId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`price` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`category` enum('cafe','pcroom','restaurant','gym','office','warehouse','transfer') NOT NULL,
	`tradeType` enum('direct','delivery','negotiable') NOT NULL DEFAULT 'direct',
	`status` enum('selling','reserved','sold') NOT NULL DEFAULT 'selling',
	`location` varchar(255),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`mainImageUrl` text,
	`viewCount` int NOT NULL DEFAULT 0,
	`favoriteCount` int NOT NULL DEFAULT 0,
	`isPremium` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`targetType` enum('product','user','comment','chat') NOT NULL,
	`targetId` int NOT NULL,
	`reason` text NOT NULL,
	`status` enum('pending','resolved','dismissed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetUserId` int NOT NULL,
	`productId` int,
	`rating` int NOT NULL,
	`content` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `userType` enum('buyer','seller') DEFAULT 'buyer' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `sellerStatus` enum('pending','approved','rejected') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `users` ADD `sellerType` enum('closing_soon','closed','relocating','inventory','transfer');--> statement-breakpoint
ALTER TABLE `users` ADD `businessNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `businessCertUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `businessPhotoUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `isVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `profileImageUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);