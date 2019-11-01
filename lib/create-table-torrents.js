module.exports =
  'DROP TABLE IF EXISTS `torrents`; \
  CREATE TABLE `torrents` ( \
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, \
  `name` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL, \
  `hash` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL, \
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \
  PRIMARY KEY (`id`) \
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;'
