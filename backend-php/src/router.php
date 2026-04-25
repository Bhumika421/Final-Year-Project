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
    if (preg_match('#^/uploads/(.+)$#', $path, $m)) {
        $filePath = __DIR__ . '/../public/uploads/' . $m[1];
        if (file_exists($filePath)) {
            $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
            $mime = ['webp'=>'image/webp','jpg'=>'image/jpeg','jpeg'=>'image/jpeg','png'=>'image/png','gif'=>'image/gif'][$ext] ?? 'application/octet-stream';
            header('Content-Type: ' . $mime);
            header('Access-Control-Allow-Origin: http://localhost:5173');
            readfile($filePath);
            exit;
        }
        http_response_code(404); exit;
    }
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
