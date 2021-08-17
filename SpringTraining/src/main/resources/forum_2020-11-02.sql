# ************************************************************
# Sequel Pro SQL dump
# Version 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: localhost (MySQL 5.7.25)
# Database: forum
# Generation Time: 2020-11-02 06:41:58 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `login_id` varchar(20) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `name` varchar(10) DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `active` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;

INSERT INTO `users` (`id`, `login_id`, `password`, `name`, `branch_id`, `department_id`, `active`, `created_at`, `updated_at`)
VALUES
	(1,'hogee3','$2a$10$lccnnggV0mT4VSFi/aAX7OE4P1ATt5Zwu1oBdAoRaMaJno5snAWQC','Hogeaあ',1,1,1,'2018-09-06 14:19:28','2019-05-17 16:49:18'),
	(2,'fugafuga','$2a$10$ey7Mdn0nct4w4ZG07UTQJ.sBwwt12nESGolczmi9Kv08FR2428KuK','FugaFuga',1,1,1,'2018-09-06 19:11:36','2019-06-27 19:12:23'),
	(3,'admin','$2a$10$YZo3wbeyefAeYZ3EK9pVTuzCk1Pq6rmi8Crtk1zZYXd/BugQR.XmG','ああああああああああ',1,1,1,'2018-09-08 02:51:21','2019-06-27 19:12:21'),
	(5,'aaaaaa','$2a$10$kTGvGfuLIZUsHOqyfXuE4ekjW7sXBV7SW.SrOFgJS2Uc/c.9yz25O','aaaaa',1,1,1,'2018-09-12 11:20:46','2019-06-27 19:12:22'),
	(6,'aaaaab','$2a$10$bAQc1OaQAERAGfMPRvRku.6LTPWXUV1d/R/3g9p1qCfzcvmqjMqy.','aaaaaa',1,1,1,'2018-09-12 12:26:56','2018-09-12 14:23:27'),
	(7,NULL,'$2a$10$aNJFbtrlnatM7DbWl7LGWeJwXG6lBkWdS4ZTE6ph89kDM0baq6Rdq','ああああ',NULL,NULL,NULL,'2020-11-02 14:35:06','2020-11-02 14:35:06');

/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;



/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
