<?php
// Enable detailed error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: *");

// Database connection - CORRECTED to use e-learning
$host = 'localhost';
$dbname = 'tsms';  // Changed from tsms to e-learning
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ATTR_ERRMODE_EXCEPTION);
    file_put_contents('debug.log', date('Y-m-d H:i:s')." - DB connected successfully\n", FILE_APPEND);
} catch (PDOException $e) {
    file_put_contents('debug.log', date('Y-m-d H:i:s')." - DB connection failed: ".$e->getMessage()."\n", FILE_APPEND);
    die(json_encode([
        'success' => false, 
        'message' => 'Database connection failed',
        'error' => $e->getMessage()
    ]));
}

// Handle registration
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    file_put_contents('debug.log', date('Y-m-d H:i:s')." - Raw input: ".$rawInput."\n", FILE_APPEND);
    
    $data = json_decode($rawInput, true);
    
    if ($data === null) {
        file_put_contents('debug.log', date('Y-m-d H:i:s')." - JSON decode failed\n", FILE_APPEND);
        echo json_encode([
            'success' => false, 
            'message' => 'Invalid JSON data',
            'error' => json_last_error_msg()
        ]);
        exit;
    }

    $username = trim($data['username'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $confirmPassword = $data['confirmPassword'] ?? '';

    // Enhanced validation
    $errors = [];
    if (empty($username)) $errors['username'] = 'Username is required';
    if (empty($email)) $errors['email'] = 'Email is required';
    if (empty($password)) $errors['password'] = 'Password is required';
    if ($password !== $confirmPassword) $errors['confirmPassword'] = 'Passwords do not match';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Invalid email format';
    
    if (!empty($errors)) {
        file_put_contents('debug.log', date('Y-m-d H:i:s')." - Validation failed: ".print_r($errors, true)."\n", FILE_APPEND);
        echo json_encode([
            'success' => false, 
            'message' => 'Validation failed',
            'errors' => $errors
        ]);
        exit;
    }

    // Check if email exists
    try {
        $stmt = $pdo->prepare("SELECT id FROM admins WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->rowCount() > 0) {
            file_put_contents('debug.log', date('Y-m-d H:i:s')." - Email already exists: $email\n", FILE_APPEND);
            echo json_encode([
                'success' => false, 
                'message' => 'Email already registered',
                'field' => 'email'
            ]);
            exit;
        }
    } catch (PDOException $e) {
        file_put_contents('debug.log', date('Y-m-d H:i:s')." - Email check error: ".$e->getMessage()."\n", FILE_APPEND);
        echo json_encode([
            'success' => false, 
            'message' => 'Error checking email availability',
            'error' => $e->getMessage()
        ]);
        exit;
    }

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    if (!$hashedPassword) {
        file_put_contents('debug.log', date('Y-m-d H:i:s')." - Password hashing failed\n", FILE_APPEND);
        echo json_encode([
            'success' => false, 
            'message' => 'Error processing password'
        ]);
        exit;
    }

    // Insert new admin
    try {
        $stmt = $pdo->prepare("INSERT INTO admins (username, email, password) VALUES (?, ?, ?)");
        $success = $stmt->execute([$username, $email, $hashedPassword]);
        
        if ($success) {
            file_put_contents('debug.log', date('Y-m-d H:i:s')." - Registration successful for $email\n", FILE_APPEND);
            echo json_encode([
                'success' => true, 
                'message' => 'Admin registered successfully',
                'userId' => $pdo->lastInsertId()
            ]);
        } else {
            $errorInfo = $stmt->errorInfo();
            file_put_contents('debug.log', date('Y-m-d H:i:s')." - Insert failed: ".print_r($errorInfo, true)."\n", FILE_APPEND);
            echo json_encode([
                'success' => false, 
                'message' => 'Registration failed',
                'error' => $errorInfo[2] // Driver-specific error message
            ]);
        }
    } catch (PDOException $e) {
        file_put_contents('debug.log', date('Y-m-d H:i:s')." - Insert error: ".$e->getMessage()."\n", FILE_APPEND);
        echo json_encode([
            'success' => false, 
            'message' => 'Database error during registration',
            'error' => $e->getMessage()
        ]);
    }
} else {
    file_put_contents('debug.log', date('Y-m-d H:i:s')." - Invalid request method: ".$_SERVER['REQUEST_METHOD']."\n", FILE_APPEND);
    echo json_encode([
        'success' => false, 
        'message' => 'Invalid request method'
    ]);
}
?>