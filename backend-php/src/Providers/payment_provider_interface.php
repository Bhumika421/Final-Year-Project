<?php
declare(strict_types=1);

interface PaymentProviderInterface {
  public function initiate(array $payload): array;
  public function capture(array $payload): array;
}
