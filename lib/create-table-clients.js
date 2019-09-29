module.exports =
  "DROP TABLE IF EXISTS `clients`; \
  CREATE TABLE `clients` ( \
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, \
  `name` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL, \
  `rpc_port` bigint(20) unsigned NOT NULL, \
  `transmission_port` bigint(20) unsigned NOT NULL, \
  `active` tinyint(1) DEFAULT '0', \
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \
  PRIMARY KEY (`id`), \
  UNIQUE KEY `rcp_port` (`rpc_port`), \
  UNIQUE KEY `transmission_port` (`transmission_port`) \
  ) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;"
