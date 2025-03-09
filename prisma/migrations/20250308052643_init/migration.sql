-- CreateTable
CREATE TABLE `Plant` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Plant_code_key`(`code`),
    INDEX `Plant_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `mobileNumber` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `plainPassword` VARCHAR(191) NULL,
    `employeeCode` VARCHAR(191) NULL,
    `role` ENUM('OPERATOR', 'SHIFT_INCHARGE', 'SUPERVISOR', 'MANAGER', 'ADMIN') NOT NULL,
    `dateRegistered` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `photo` VARCHAR(191) NULL,
    `plantId` VARCHAR(191) NOT NULL,

    INDEX `User_plantId_role_idx`(`plantId`, `role`),
    INDEX `User_employeeCode_idx`(`employeeCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `designName` VARCHAR(191) NOT NULL,
    `designCode` VARCHAR(191) NOT NULL,
    `neck` DOUBLE NOT NULL,
    `volume` DOUBLE NOT NULL,
    `weight` DOUBLE NOT NULL,
    `colour` VARCHAR(191) NOT NULL,
    `itemCode` VARCHAR(191) NOT NULL,
    `unitType` VARCHAR(191) NOT NULL,
    `buyPrice` DOUBLE NOT NULL,
    `sellPrice` DOUBLE NOT NULL,
    `remark` VARCHAR(191) NULL,
    `minStockAlert` INTEGER NOT NULL,
    `openingStock` INTEGER NOT NULL,
    `qrBarcode` VARCHAR(191) NULL,
    `bagSize` INTEGER NOT NULL,
    `traySize` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `plantId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Product_itemCode_key`(`itemCode`),
    INDEX `Product_plantId_itemCode_idx`(`plantId`, `itemCode`),
    INDEX `Product_designCode_idx`(`designCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Stock` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `openingStock` INTEGER NOT NULL,
    `inwardQty` INTEGER NOT NULL DEFAULT 0,
    `outwardQty` INTEGER NOT NULL DEFAULT 0,
    `closingStock` INTEGER NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `plantId` VARCHAR(191) NOT NULL,

    INDEX `Stock_plantId_date_idx`(`plantId`, `date`),
    UNIQUE INDEX `Stock_productId_date_key`(`productId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Supplier` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `mobileNumber` VARCHAR(191) NULL,
    `remark` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `plantId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Supplier_code_key`(`code`),
    INDEX `Supplier_plantId_code_idx`(`plantId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Inward` (
    `id` VARCHAR(191) NOT NULL,
    `source` ENUM('MANUFACTURED', 'SUPPLIER') NOT NULL,
    `manufacturedQty` INTEGER NULL,
    `qtyIncharge` INTEGER NULL,
    `qtySupervisor` INTEGER NULL,
    `finalQty` INTEGER NOT NULL,
    `supplierName` VARCHAR(191) NULL,
    `supplierCode` VARCHAR(191) NULL,
    `openingStock` INTEGER NULL,
    `closingStock` INTEGER NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `plantId` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `supervisorId` VARCHAR(191) NULL,
    `supplierId` VARCHAR(191) NULL,

    INDEX `Inward_plantId_date_idx`(`plantId`, `date`),
    INDEX `Inward_productId_date_idx`(`productId`, `date`),
    INDEX `Inward_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Outward` (
    `id` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `remarks` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `plantId` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,

    INDEX `Outward_plantId_date_idx`(`plantId`, `date`),
    INDEX `Outward_productId_date_idx`(`productId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MonthlyReport` (
    `id` VARCHAR(191) NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `openingStock` INTEGER NOT NULL,
    `inwardQty` INTEGER NOT NULL,
    `outwardQty` INTEGER NOT NULL,
    `closingStock` INTEGER NOT NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `productId` VARCHAR(191) NOT NULL,
    `plantId` VARCHAR(191) NOT NULL,

    INDEX `MonthlyReport_plantId_year_month_idx`(`plantId`, `year`, `month`),
    UNIQUE INDEX `MonthlyReport_productId_month_year_plantId_key`(`productId`, `month`, `year`, `plantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `Plant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `Plant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Stock` ADD CONSTRAINT `Stock_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Stock` ADD CONSTRAINT `Stock_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `Plant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Supplier` ADD CONSTRAINT `Supplier_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `Plant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inward` ADD CONSTRAINT `Inward_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inward` ADD CONSTRAINT `Inward_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `Plant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inward` ADD CONSTRAINT `Inward_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inward` ADD CONSTRAINT `Inward_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inward` ADD CONSTRAINT `Inward_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Outward` ADD CONSTRAINT `Outward_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Outward` ADD CONSTRAINT `Outward_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `Plant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Outward` ADD CONSTRAINT `Outward_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
