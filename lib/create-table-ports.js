module.exports =
  "DROP TABLE IF EXISTS `ports`; \
  CREATE TABLE `ports` ( \
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, \
  `rpc_port` bigint(20) unsigned NOT NULL, \
  `transmission_port` bigint(20) unsigned NOT NULL, \
  `available` tinyint(1) DEFAULT '1', \
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \
  PRIMARY KEY (`id`) \
  ) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;"
