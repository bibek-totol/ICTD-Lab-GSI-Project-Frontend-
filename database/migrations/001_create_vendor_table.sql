CREATE DATABASE IF NOT EXISTS `ictd-lab`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `ictd-lab`;

CREATE TABLE IF NOT EXISTS `Vendor` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(500) NOT NULL,
  `address` TEXT NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `serial` INT UNSIGNED NOT NULL DEFAULT 1,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_vendor_name_phone` (`name`(191), `phone`),
  INDEX `idx_vendor_serial` (`serial`),
  INDEX `idx_vendor_active` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `Vendor` (`name`, `address`, `phone`, `serial`, `isActive`)
VALUES
  (
    'JV of Optimal IT Ltd; Savvy Techmart Ltd and LAL Sobuz Technology',
    '4/16 Humayun Road (3rd Floor), Mohammadpur, Dhaka-1207',
    '01711-588054',
    1,
    TRUE
  ),
  (
    'JV of IBCS-Primax Software (Bangladesh) Ltd, Leads Training & Consulting Ltd and Virtual Market Solution Ltd',
    'House- 6/2 (Level 4 & 6), Kazi Nazrul Islam Road, Block-F, Dhaka-1207',
    '01713-397560',
    2,
    TRUE
  ),
  (
    'DataSoft Systems Bangladesh Ltd',
    'House-11, Road-113/A, Gulshan-2, Dhaka-1212',
    '01712-445566',
    3,
    TRUE
  ),
  (
    'Southtech Limited',
    'Rangs Pearl Tower, Mohakhali, Dhaka-1212',
    '01715-998877',
    4,
    TRUE
  ),
  (
    'Tiger IT Bangladesh Ltd',
    'Rangs Bhaban, Gulshan-1, Dhaka-1212',
    '01718-223344',
    5,
    TRUE
  ),
  (
    'Dream71 Bangladesh Ltd',
    'Banani DOHS, Dhaka-1206',
    '01719-667788',
    6,
    TRUE
  )
ON DUPLICATE KEY UPDATE
  `address` = VALUES(`address`),
  `serial` = VALUES(`serial`),
  `isActive` = VALUES(`isActive`),
  `updatedAt` = CURRENT_TIMESTAMP;
