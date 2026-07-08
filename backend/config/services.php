<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Canal de vérification OTP : email (défaut prod, gratuit) | sms | log.
    'otp' => [
        'channel' => env('OTP_CHANNEL'),
    ],

    // Envoi de SMS (OTP / alertes). Pilote choisi par OTP_SMS_DRIVER.
    'sms' => [
        'driver' => env('OTP_SMS_DRIVER', 'log'),
        'sender_name' => env('OTP_SENDER_NAME', 'TontineSec'),
        'orange' => [
            'token' => env('ORANGE_SMS_TOKEN'),
            'sender_url' => env('ORANGE_SMS_SENDER_URL'),
        ],
        'twilio' => [
            'sid' => env('TWILIO_SID'),
            'token' => env('TWILIO_AUTH_TOKEN'),
            'from' => env('TWILIO_FROM'),
        ],
    ],

];
