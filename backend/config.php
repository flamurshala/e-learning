<?php

function backend_config(?string $key = null) {
    static $config = null;

    if ($config === null) {
        $config = [
            'certificate_download_api_key' => getenv('CERTIFICATE_DOWNLOAD_API_KEY') ?: '',
            'certificate_download_allowed_origins' => array_filter(array_map('trim', explode(',', getenv('CERTIFICATE_DOWNLOAD_ALLOWED_ORIGINS') ?: 'https://tsms.tectigonacademy.com,http://localhost,http://localhost:3000'))),
            'certificate_download_rate_limit_max' => (int)(getenv('CERTIFICATE_DOWNLOAD_RATE_LIMIT_MAX') ?: 20),
            'certificate_download_rate_limit_window' => (int)(getenv('CERTIFICATE_DOWNLOAD_RATE_LIMIT_WINDOW') ?: 60),
        ];

        $localConfig = __DIR__ . '/local_config.php';
        if (is_file($localConfig)) {
            $local = require $localConfig;
            if (is_array($local)) {
                $config = array_replace($config, $local);
            }
        }
    }

    if ($key === null) {
        return $config;
    }

    return $config[$key] ?? null;
}

