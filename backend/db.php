<?php

// localhost db credentials =================================================================================


  $host = 'localhost';
  $dbname = 'tsms';
  $user = 'root';
  $pass = '';

  try{
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
  } catch (PDOException $e){
    die("Connection failed: " . $e->getMessage());
  }
   
   
// online db credentials =================================================================================
   
   // $host = 'localhost';
   // $dbname = 'u729255246_tsms';
   // $user = 'u729255246_tsms';
   // $pass = 'Erioni00##';

   // try{
   //  $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
   // } catch (PDOException $e){
   //  die("Connection failed: " . $e->getMessage());
   // }
?>