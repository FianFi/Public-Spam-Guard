-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 16 Nov 2026 pada 22.12
-- Versi server: 10.4.32-MariaDB-log
-- Versi PHP: 8.5.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `spam_guard_dsa`
--
CREATE DATABASE IF NOT EXISTS `spam_guard_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `spam_guard_db`;

-- --------------------------------------------------------

--
-- Struktur dari tabel `guild_info`
--

CREATE TABLE IF NOT EXISTS `guild_info` (
  `guild_id` varchar(32) NOT NULL,
  `guild_name` varchar(255) NOT NULL,
  `owner_id` varchar(32) NOT NULL,
  `admin_role` varchar(32) DEFAULT NULL,
  `guild_invite_link` varchar(255) DEFAULT NULL,
  `first_setup_at` datetime NOT NULL DEFAULT current_timestamp(),
  `is_premium` tinyint(1) NOT NULL DEFAULT 0,
  `premium_expires_at` datetime DEFAULT NULL,
  `premium_buyer_id` varchar(32) DEFAULT NULL,
  `log_channel_id` varchar(32) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- --------------------------------------------------------

--
-- Struktur dari tabel `void_setting`
--

CREATE TABLE IF NOT EXISTS `void_setting` (
  `guild_id` varchar(32) NOT NULL,
  `void_channel_id` varchar(32) NOT NULL,
  `void_msg_id` varchar(32) NOT NULL,
  `void_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `void_punishment` varchar(32) NOT NULL DEFAULT 'kick',
  `kick_count` int(4) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `guild_info`
--
ALTER TABLE `guild_info`
  ADD PRIMARY KEY (`guild_id`);

--
-- Indeks untuk tabel `void_setting`
--
ALTER TABLE `void_setting`
  ADD PRIMARY KEY (`guild_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
