-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jul 11, 2025 at 02:44 PM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tsms`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `email`, `password`) VALUES
(1, 'alaudinAdmini', 'admin@gmail.com', '$2y$10$8ykjOksxe6XoZwnY6sHGBOHdfGpUK9yYMV1PoaBq06HIBzeSQzoOq');

-- --------------------------------------------------------

--
-- Table structure for table `admin_notifications`
--

CREATE TABLE `admin_notifications` (
  `id` int NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_notifications`
--

INSERT INTO `admin_notifications` (`id`, `message`, `created_at`) VALUES
(24, '📝 Make the certificates ready for course \"test notifi 2\". Only two session remains.', '2025-07-11 14:03:23');

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `audience` enum('students','professors') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `announcements`
--

INSERT INTO `announcements` (`id`, `title`, `content`, `audience`, `created_at`) VALUES
(13, 'test', 'test', 'students', '2025-06-30 02:41:06'),
(14, 'testv2', 'testv2', 'students', '2025-06-30 02:59:00'),
(15, 'testv3', 'testv3', 'students', '2025-06-30 03:15:23'),
(16, 'test', 'test', 'professors', '2025-06-30 05:15:13'),
(17, 'test', 'test', 'professors', '2025-06-30 07:24:09'),
(18, 'test', 'test', 'students', '2025-06-30 08:39:02'),
(19, 'test', 'test', 'students', '2025-06-30 09:00:41'),
(20, 'testv2', 'testv2', 'students', '2025-07-05 11:31:07'),
(21, 'hej gk', 'ku jeni p9', 'professors', '2025-07-08 01:04:39');

-- --------------------------------------------------------

--
-- Table structure for table `assignments`
--

CREATE TABLE `assignments` (
  `id` int NOT NULL,
  `course_id` int NOT NULL,
  `professor_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `due_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `id` int NOT NULL,
  `session_id` int NOT NULL,
  `student_id` int NOT NULL,
  `status` enum('present','absent','online') NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`id`, `session_id`, `student_id`, `status`, `updated_at`) VALUES
(286, 30, 30, 'present', '2025-07-08 12:02:37'),
(287, 32, 30, 'absent', '2025-07-08 12:38:11'),
(288, 32, 32, 'present', '2025-07-08 12:38:11'),
(289, 27, 30, 'present', '2025-07-10 11:50:42'),
(290, 27, 31, 'present', '2025-07-10 11:50:42'),
(293, 28, 30, 'present', '2025-07-10 12:01:10'),
(294, 28, 31, 'present', '2025-07-10 12:01:10'),
(295, 29, 30, 'present', '2025-07-10 12:02:53'),
(296, 29, 31, 'present', '2025-07-10 12:02:53'),
(300, 40, 30, 'absent', '2025-07-10 12:41:25'),
(301, 40, 31, 'present', '2025-07-10 12:41:25'),
(302, 40, 32, 'present', '2025-07-10 12:41:25'),
(303, 41, 30, 'present', '2025-07-10 12:41:33'),
(304, 41, 31, 'present', '2025-07-10 12:41:33'),
(305, 52, 30, 'absent', '2025-07-10 12:43:59'),
(306, 52, 31, 'present', '2025-07-10 12:43:59'),
(307, 52, 32, 'present', '2025-07-10 12:43:59'),
(308, 49, 30, 'present', '2025-07-10 12:44:15'),
(309, 49, 31, 'present', '2025-07-10 12:44:15'),
(310, 49, 32, 'online', '2025-07-10 12:44:15'),
(311, 50, 30, 'present', '2025-07-10 12:44:24'),
(312, 50, 31, 'present', '2025-07-10 12:44:24'),
(313, 50, 32, 'present', '2025-07-10 12:44:24'),
(314, 51, 30, 'present', '2025-07-10 12:44:32'),
(315, 51, 31, 'present', '2025-07-10 12:44:32'),
(316, 51, 32, 'present', '2025-07-10 12:44:32'),
(317, 39, 30, 'present', '2025-07-11 11:49:54'),
(318, 39, 31, 'present', '2025-07-11 11:49:54'),
(319, 39, 32, 'present', '2025-07-11 11:49:54'),
(320, 55, 33, 'present', '2025-07-11 11:51:44'),
(321, 56, 33, 'present', '2025-07-11 11:51:52'),
(322, 60, 30, 'present', '2025-07-11 12:03:07'),
(323, 61, 30, 'present', '2025-07-11 12:03:23');

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `professor_id` int DEFAULT NULL,
  `completed` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`id`, `title`, `description`, `created_at`, `professor_id`, `completed`) VALUES
(44, 'Full Stack', 'test', '2025-07-08 12:00:29', 11, 1),
(45, 'Python 2', 'test', '2025-07-08 12:34:00', 11, 0),
(46, 'testim', 'adsdasdasd', '2025-07-10 12:40:35', 9, 0),
(48, 'me 4', 'dadasd', '2025-07-10 12:43:07', 9, 1),
(49, 'test notifications', 'testimi a po bajn notifications', '2025-07-11 11:51:17', 9, 0),
(50, 'test notifi 2', 'qdqw', '2025-07-11 12:02:33', 9, 0);

-- --------------------------------------------------------

--
-- Table structure for table `course_professor`
--

CREATE TABLE `course_professor` (
  `id` int NOT NULL,
  `professor_id` int NOT NULL,
  `course_id` int NOT NULL,
  `enrolled_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `course_professor`
--

INSERT INTO `course_professor` (`id`, `professor_id`, `course_id`, `enrolled_at`) VALUES
(30, 11, 44, '2025-07-08 14:00:29'),
(31, 11, 45, '2025-07-08 14:34:00'),
(32, 9, 46, '2025-07-10 14:40:35'),
(34, 9, 48, '2025-07-10 14:43:07'),
(35, 9, 49, '2025-07-11 13:51:17'),
(36, 9, 50, '2025-07-11 14:02:33');

-- --------------------------------------------------------

--
-- Table structure for table `course_student`
--

CREATE TABLE `course_student` (
  `id` int NOT NULL,
  `student_id` int NOT NULL,
  `course_id` int NOT NULL,
  `enrolled_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `course_student`
--

INSERT INTO `course_student` (`id`, `student_id`, `course_id`, `enrolled_at`) VALUES
(92, 30, 44, '2025-07-08 12:01:01'),
(93, 31, 44, '2025-07-08 12:01:31'),
(94, 30, 45, '2025-07-08 12:34:00'),
(95, 32, 45, '2025-07-08 12:34:35'),
(96, 30, 46, '2025-07-10 12:40:35'),
(97, 31, 46, '2025-07-10 12:40:35'),
(98, 32, 46, '2025-07-10 12:40:35'),
(102, 30, 48, '2025-07-10 12:43:07'),
(103, 31, 48, '2025-07-10 12:43:07'),
(104, 32, 48, '2025-07-10 12:43:07'),
(106, 33, 44, '2025-07-10 13:39:24'),
(107, 33, 49, '2025-07-11 11:51:17'),
(108, 30, 50, '2025-07-11 12:02:33'),
(109, 34, 44, '2025-07-11 12:25:57'),
(110, 34, 45, '2025-07-11 12:25:57');

-- --------------------------------------------------------

--
-- Table structure for table `professors`
--

CREATE TABLE `professors` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `professors`
--

INSERT INTO `professors` (`id`, `name`, `email`, `created_at`, `password`) VALUES
(9, 'Mergim Alidema', 'mergim@gmail.com', '2025-06-20 08:16:13', '1234'),
(10, 'Egzon Uka', 'egzon@gmail.com', '2025-06-20 08:16:37', '4321'),
(11, 'Erion Prokshi', 'erion@gmail.com', '2025-06-22 15:17:15', '1234'),
(12, 'new prof', 'newprof@gmail.com', '2025-07-11 12:31:37', '1234');

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE `questions` (
  `id` int NOT NULL,
  `user` varchar(100) NOT NULL,
  `question` text NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `questions`
--

INSERT INTO `questions` (`id`, `user`, `question`, `created_at`) VALUES
(8, 'Omer Mulliqi', 'hej', '2025-06-30 10:21:41'),
(9, 'Omer Mulliqi', 'hej', '2025-06-30 10:34:59'),
(10, 'Omer Mulliqi', 'hej jakub', '2025-06-30 10:41:20'),
(11, 'Omer Mulliqi', 'hello', '2025-06-30 10:50:37'),
(12, 'Omer Mulliqi', 'hello', '2025-06-30 10:56:46'),
(13, 'Omer Mulliqi', 'hello world', '2025-06-30 11:03:03'),
(14, 'Alaudin Haradinaj', 'hi', '2025-06-30 11:23:51'),
(15, 'Jakub Demaliaj', 'hello', '2025-06-30 11:25:04'),
(16, 'Alaudin haradinaj', 'hi', '2025-07-05 13:35:47');

-- --------------------------------------------------------

--
-- Table structure for table `replies`
--

CREATE TABLE `replies` (
  `id` int NOT NULL,
  `question_id` int NOT NULL,
  `user` varchar(100) NOT NULL,
  `reply` text NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `replies`
--

INSERT INTO `replies` (`id`, `question_id`, `user`, `reply`, `created_at`) VALUES
(10, 8, 'Omer Mulliqi', 'hi', '2025-06-30 10:27:52'),
(11, 10, 'Omer Mulliqi', 'fol omer', '2025-06-30 10:41:33'),
(12, 10, 'Omer Mulliqi', 'gseg', '2025-06-30 10:41:39'),
(13, 11, 'Omer Mulliqi', 'hi', '2025-06-30 10:50:43'),
(14, 13, 'Omer Mulliqi', 'hwllo', '2025-06-30 11:03:12'),
(15, 13, 'Omer Mulliqi', 'wgds', '2025-06-30 11:03:18'),
(16, 14, 'Alaudin Haradinaj', 'wed', '2025-06-30 11:23:54'),
(17, 14, 'Jakub Demaliaj', 'ku je mar ti', '2025-06-30 11:25:13'),
(18, 16, 'Alaudin haradinaj', 'hi', '2025-07-05 13:36:01'),
(19, 16, 'Jakub Demaliaj', 'hi', '2025-07-05 13:39:34');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `surname` varchar(100) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `notes` text,
  `phone_number` varchar(20) DEFAULT NULL,
  `personal_number` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `name`, `surname`, `email`, `notes`, `phone_number`, `personal_number`) VALUES
(30, 'Omer Mulliqi', NULL, 'omer@gmail.com', NULL, '045 757 823', NULL),
(31, 'Alaudn haradinaj', NULL, 'alaudin@gamil.com', NULL, '044 638 823', NULL),
(32, 'Jakub Demalia', NULL, 'jakub@gmail.com', NULL, '253525235', NULL),
(33, 'Erion Prokshi', NULL, 'erion-prokshi@hotmail.com', NULL, '63131116151', NULL),
(34, 'Erion', 'shala', 'erion@hotmail.com', 'dadasdsadsadasd', '63131116151', '1240887033');

-- --------------------------------------------------------

--
-- Table structure for table `student_course_payments`
--

CREATE TABLE `student_course_payments` (
  `id` int NOT NULL,
  `student_id` int NOT NULL,
  `course_id` int NOT NULL,
  `payment_method` enum('All','Divided') NOT NULL,
  `amount_paid_all` decimal(10,2) DEFAULT NULL,
  `amount_paid_month1` decimal(10,2) DEFAULT NULL,
  `amount_paid_month2` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `progress_percent` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_payments`
--

CREATE TABLE `student_payments` (
  `id` int NOT NULL,
  `student_id` int NOT NULL,
  `course_id` int NOT NULL,
  `payment_method` enum('All','Divided') NOT NULL,
  `amount_all` decimal(10,2) DEFAULT NULL,
  `amount_month1` decimal(10,2) DEFAULT NULL,
  `amount_month2` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_payments`
--

INSERT INTO `student_payments` (`id`, `student_id`, `course_id`, `payment_method`, `amount_all`, `amount_month1`, `amount_month2`, `created_at`) VALUES
(6, 30, 44, 'All', 100.00, NULL, NULL, '2025-07-08 12:01:01'),
(7, 31, 44, 'Divided', NULL, 50.00, 50.00, '2025-07-08 12:01:31'),
(8, 32, 45, 'All', 100.00, NULL, NULL, '2025-07-08 12:34:35'),
(10, 33, 44, 'All', 270.00, NULL, NULL, '2025-07-10 13:39:24'),
(11, 34, 44, 'All', 250.00, NULL, NULL, '2025-07-11 12:25:57'),
(12, 34, 45, 'Divided', NULL, 100.00, 150.00, '2025-07-11 12:25:57');

-- --------------------------------------------------------

--
-- Table structure for table `student_progress`
--

CREATE TABLE `student_progress` (
  `id` int NOT NULL,
  `student_id` int NOT NULL,
  `course_id` int NOT NULL,
  `progress_percent` tinyint DEFAULT '0',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `training_sessions`
--

CREATE TABLE `training_sessions` (
  `id` int NOT NULL,
  `course_id` int NOT NULL,
  `session_number` int NOT NULL,
  `session_date` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `submitted_at` datetime DEFAULT NULL,
  `submitted_after_seconds` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `training_sessions`
--

INSERT INTO `training_sessions` (`id`, `course_id`, `session_number`, `session_date`, `created_at`, `submitted_at`, `submitted_after_seconds`) VALUES
(27, 44, 1, '2025-07-08 12:00:29', '2025-07-08 12:00:29', '2025-07-10 13:50:42', 0),
(28, 44, 2, '2025-07-09 12:00:29', '2025-07-08 12:00:29', '2025-07-10 14:01:10', 0),
(29, 44, 3, '2025-07-10 12:00:29', '2025-07-08 12:00:29', '2025-07-10 14:02:53', 0),
(30, 44, 4, '2025-07-11 12:00:29', '2025-07-08 12:00:29', '2025-07-08 14:02:37', 0),
(31, 44, 5, '2025-07-12 12:00:29', '2025-07-08 12:00:29', NULL, NULL),
(32, 45, 1, '2025-07-08 12:34:00', '2025-07-08 12:34:00', '2025-07-08 14:38:11', 0),
(33, 45, 2, '2025-07-09 12:34:00', '2025-07-08 12:34:00', NULL, NULL),
(34, 45, 3, '2025-07-10 12:34:00', '2025-07-08 12:34:00', NULL, NULL),
(35, 45, 4, '2025-07-11 12:34:00', '2025-07-08 12:34:00', NULL, NULL),
(36, 45, 5, '2025-07-12 12:34:00', '2025-07-08 12:34:00', NULL, NULL),
(37, 45, 6, '2025-07-13 12:34:00', '2025-07-08 12:34:00', NULL, NULL),
(38, 45, 7, '2025-07-14 12:34:00', '2025-07-08 12:34:00', NULL, NULL),
(39, 46, 1, '2025-07-10 12:40:35', '2025-07-10 12:40:35', '2025-07-11 13:49:54', 0),
(40, 46, 2, '2025-07-11 12:40:35', '2025-07-10 12:40:35', '2025-07-10 14:41:25', 0),
(41, 46, 3, '2025-07-12 12:40:35', '2025-07-10 12:40:35', '2025-07-10 14:41:33', 0),
(42, 46, 4, '2025-07-13 12:40:35', '2025-07-10 12:40:35', NULL, NULL),
(43, 46, 5, '2025-07-14 12:40:35', '2025-07-10 12:40:35', NULL, NULL),
(49, 48, 1, '2025-07-10 12:43:07', '2025-07-10 12:43:07', '2025-07-10 14:44:15', 0),
(50, 48, 2, '2025-07-11 12:43:07', '2025-07-10 12:43:07', '2025-07-10 14:44:24', 0),
(51, 48, 3, '2025-07-12 12:43:07', '2025-07-10 12:43:07', '2025-07-10 14:44:32', 0),
(52, 48, 4, '2025-07-13 12:43:07', '2025-07-10 12:43:07', '2025-07-10 14:43:59', 0),
(53, 48, 5, '2025-07-14 12:43:07', '2025-07-10 12:43:07', NULL, NULL),
(54, 48, 6, '2025-07-15 12:43:07', '2025-07-10 12:43:07', NULL, NULL),
(55, 49, 1, '2025-07-11 11:51:17', '2025-07-11 11:51:17', '2025-07-11 13:51:44', 0),
(56, 49, 2, '2025-07-12 11:51:17', '2025-07-11 11:51:17', '2025-07-11 13:51:52', 0),
(57, 49, 3, '2025-07-13 11:51:17', '2025-07-11 11:51:17', NULL, NULL),
(58, 49, 4, '2025-07-14 11:51:17', '2025-07-11 11:51:17', NULL, NULL),
(59, 49, 5, '2025-07-15 11:51:17', '2025-07-11 11:51:17', NULL, NULL),
(60, 50, 1, '2025-07-11 12:02:33', '2025-07-11 12:02:33', '2025-07-11 14:03:07', 0),
(61, 50, 2, '2025-07-12 12:02:33', '2025-07-11 12:02:33', '2025-07-11 14:03:23', 0),
(62, 50, 3, '2025-07-13 12:02:33', '2025-07-11 12:02:33', NULL, NULL),
(63, 50, 4, '2025-07-14 12:02:33', '2025-07-11 12:02:33', NULL, NULL),
(64, 50, 5, '2025-07-15 12:02:33', '2025-07-11 12:02:33', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_announcements`
--

CREATE TABLE `user_announcements` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `user_type` enum('student','professor') NOT NULL,
  `announcement_id` int NOT NULL,
  `is_read` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_announcements`
--

INSERT INTO `user_announcements` (`id`, `user_id`, `user_type`, `announcement_id`, `is_read`) VALUES
(1, 9, 'student', 13, 0),
(2, 9, 'student', 13, 0),
(3, 9, 'student', 14, 0),
(4, 9, 'student', 15, 0),
(5, 10, 'student', 13, 0),
(6, 10, 'student', 14, 0),
(7, 10, 'student', 15, 0),
(8, 11, 'professor', 16, 0),
(9, 11, 'professor', 16, 0),
(10, 11, 'professor', 17, 0),
(11, 9, 'professor', 16, 0),
(12, 9, 'professor', 17, 0),
(13, 19, 'student', 13, 0),
(14, 19, 'student', 14, 0),
(15, 19, 'student', 15, 0),
(16, 19, 'student', 18, 0),
(17, 20, 'student', 13, 0),
(18, 20, 'student', 14, 0),
(19, 20, 'student', 15, 0),
(20, 20, 'student', 18, 0),
(21, 20, 'student', 19, 0),
(22, 20, 'student', 13, 0),
(23, 20, 'student', 14, 0),
(24, 20, 'student', 15, 0),
(25, 20, 'student', 18, 0),
(26, 20, 'student', 19, 0),
(27, 20, 'student', 20, 0),
(28, 20, 'student', 13, 0),
(29, 20, 'student', 14, 0),
(30, 20, 'student', 15, 0),
(31, 20, 'student', 18, 0),
(32, 20, 'student', 19, 0),
(33, 20, 'student', 20, 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `assignments`
--
ALTER TABLE `assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_id` (`course_id`),
  ADD KEY `professor_id` (`professor_id`);

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_attendance_session` (`session_id`),
  ADD KEY `fk_attendance_student` (`student_id`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_professor` (`professor_id`);

--
-- Indexes for table `course_professor`
--
ALTER TABLE `course_professor`
  ADD PRIMARY KEY (`id`),
  ADD KEY `professor_id` (`professor_id`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `course_student`
--
ALTER TABLE `course_student`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `professors`
--
ALTER TABLE `professors`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `questions`
--
ALTER TABLE `questions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `replies`
--
ALTER TABLE `replies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `question_id` (`question_id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `student_course_payments`
--
ALTER TABLE `student_course_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `student_payments`
--
ALTER TABLE `student_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `fk_payment_course` (`course_id`);

--
-- Indexes for table `student_progress`
--
ALTER TABLE `student_progress`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `training_sessions`
--
ALTER TABLE `training_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `user_announcements`
--
ALTER TABLE `user_announcements`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `admin_notifications`
--
ALTER TABLE `admin_notifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `assignments`
--
ALTER TABLE `assignments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=324;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `course_professor`
--
ALTER TABLE `course_professor`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `course_student`
--
ALTER TABLE `course_student`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=111;

--
-- AUTO_INCREMENT for table `professors`
--
ALTER TABLE `professors`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `replies`
--
ALTER TABLE `replies`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `student_course_payments`
--
ALTER TABLE `student_course_payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `student_payments`
--
ALTER TABLE `student_payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `student_progress`
--
ALTER TABLE `student_progress`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `training_sessions`
--
ALTER TABLE `training_sessions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `user_announcements`
--
ALTER TABLE `user_announcements`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `assignments`
--
ALTER TABLE `assignments`
  ADD CONSTRAINT `assignments_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `assignments_ibfk_2` FOREIGN KEY (`professor_id`) REFERENCES `professors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `fk_attendance_session` FOREIGN KEY (`session_id`) REFERENCES `training_sessions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_attendance_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `courses`
--
ALTER TABLE `courses`
  ADD CONSTRAINT `fk_professor` FOREIGN KEY (`professor_id`) REFERENCES `professors` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `course_professor`
--
ALTER TABLE `course_professor`
  ADD CONSTRAINT `course_professor_ibfk_1` FOREIGN KEY (`professor_id`) REFERENCES `professors` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_professor_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_student`
--
ALTER TABLE `course_student`
  ADD CONSTRAINT `course_student_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_student_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `replies`
--
ALTER TABLE `replies`
  ADD CONSTRAINT `replies_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `student_course_payments`
--
ALTER TABLE `student_course_payments`
  ADD CONSTRAINT `student_course_payments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_course_payments_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `student_payments`
--
ALTER TABLE `student_payments`
  ADD CONSTRAINT `fk_payment_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`),
  ADD CONSTRAINT `student_payments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `student_progress`
--
ALTER TABLE `student_progress`
  ADD CONSTRAINT `student_progress_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  ADD CONSTRAINT `student_progress_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`);

--
-- Constraints for table `training_sessions`
--
ALTER TABLE `training_sessions`
  ADD CONSTRAINT `training_sessions_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
