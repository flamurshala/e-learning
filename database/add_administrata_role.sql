-- Run this migration to add the administrata role
ALTER TABLE `admins`
  MODIFY `role` ENUM('admin','superadmin','administrata') NOT NULL DEFAULT 'admin';
