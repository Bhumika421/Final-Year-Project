<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/utils.php';

class Router {
  private array $routes = [];

  public function add(string $method, string $pattern, callable $handler): void {
    $method = strtoupper($method);
    $pattern = '#^' . preg_replace('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#', '(?P<$1>[^/]+)', $pattern) . '$#';
    $this->routes[] = [$method, $pattern, $handler];
  }

  public function dispatch(string $method, string $path): void {
    $method = strtoupper($method);
    foreach ($this->routes as [$m, $pattern, $handler]) {
      if ($m !== $method) continue;
      if (preg_match($pattern, $path, $matches)) {
        $params = [];
        foreach ($matches as $k=>$v) if (!is_int($k)) $params[$k]=$v;
        $handler($params);
        return;
      }
    }
    json_response(['error' => 'Not Found', 'path' => $path], 404);
  }
}
