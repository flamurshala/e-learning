<?php
   $host = 'localhost';
   $dbname = 'tsms';
   $user = 'root';
   $pass = '';

   try{
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
   } catch (PDOException $e){
    die("Connection failed: " . $e->getMessage());
   }
?>