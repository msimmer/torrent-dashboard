module.exports =
  'DROP TABLE IF EXISTS `client_torrents`; \
  CREATE TABLE `client_torrents` ( \
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT, \
  `client_id` bigint(20) unsigned NOT NULL, \
  `torrent_id` bigint(20) unsigned NOT NULL, \
  PRIMARY KEY (`id`), \
  KEY `client_torrents_client_id_index` (`client_id`), \
  KEY `client_torrents_torrent_id_index` (`torrent_id`), \
  UNIQUE KEY (`client_id`, `torrent_id`), \
  CONSTRAINT `client_torrents_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE, \
  CONSTRAINT `client_torrents_ibfk_2` FOREIGN KEY (`torrent_id`) REFERENCES `torrents` (`id`) ON DELETE CASCADE \
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;'
