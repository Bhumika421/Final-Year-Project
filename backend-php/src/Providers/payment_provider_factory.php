<?php
declare(strict_types=1);

require_once __DIR__ . '/paypal_provider.php';
require_once __DIR__ . '/esewa_provider.php';
require_once __DIR__ . '/khalti_provider.php';

class PaymentProviderFactory {
  public static function make(string $method): PaymentProviderInterface {
    $config = require __DIR__ . '/../config/config.php';

    if ($method === 'paypal') {
      return new PayPalProvider($config['payments']['paypal'] ?? []);
    }

    if ($method === 'esewa') {
      return new ESewaProvider($config['payments']['esewa'] ?? []);
    }

    if ($method === 'khalti') {
      return new KhaltiProvider($config['payments']['khalti'] ?? []);
    }

    throw new InvalidArgumentException('Unsupported payment method: ' . $method);
  }
}
