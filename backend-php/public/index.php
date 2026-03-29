<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/middleware/cors.php';
require_once __DIR__ . '/../src/router.php';

require_once __DIR__ . '/../src/middleware/auth.php';

require_once __DIR__ . '/../src/controllers/auth_controller.php';
require_once __DIR__ . '/../src/controllers/tours_controller.php';
require_once __DIR__ . '/../src/controllers/wishlist_controller.php';
require_once __DIR__ . '/../src/controllers/bookings_controller.php';
require_once __DIR__ . '/../src/controllers/support_controller.php';
require_once __DIR__ . '/../src/controllers/notifications_controller.php';
require_once __DIR__ . '/../src/controllers/currency_controller.php';
require_once __DIR__ . '/../src/controllers/admin_controller.php';

require_once __DIR__ . '/../src/controllers/upload_controller.php';
handle_cors();

$router = new Router();

// Health
$router->add('GET', '/api/health', function() {
  json_response(['ok'=>true,'time'=>now_iso()]);
});

// Auth
$router->add('POST', '/api/auth/register',       function() { auth_register(); });
$router->add('POST', '/api/auth/register-agency', function() { auth_register_agency(); });
$router->add('POST', '/api/auth/register-admin',  function() { auth_register_admin(); });
$router->add('POST', '/api/auth/login',           function() { auth_login(); });
$router->add('GET',  '/api/auth/me', function() {
  $user = require_auth();
  auth_me($user);
});
$router->add('PUT', '/api/auth/update', function() {
  $user = require_auth();
  auth_update($user);
});

// Tours (public)
$router->add('GET', '/api/tours',      function() { tours_list(); });
$router->add('GET', '/api/tours/{id}', function($params) { tours_get($params); });

// Tours (admin)
$router->add('GET',  '/api/admin/tours',              function() { $admin = require_admin(); admin_tours_list_all(); });
$router->add('GET',  '/api/admin/tours/pending',      function() { $admin = require_admin(); admin_tours_pending(); });
$router->add('POST', '/api/admin/tours/{id}/decide',  function($params) { $admin = require_admin(); admin_tour_decide($params, $admin); });
$router->add('GET',  '/api/admin/agencies/pending',   function() { $admin = require_admin(); admin_agencies_pending(); });
$router->add('POST', '/api/admin/agencies/{id}/verify', function($params) { $admin = require_admin(); admin_agency_verify($params); });
$router->add('POST', '/api/admin/tours',              function() { $admin = require_admin(); tours_create($admin); });
$router->add('PUT',  '/api/admin/tours/{id}',         function($params) { $admin = require_admin(); tours_update($params, $admin); });
$router->add('DELETE', '/api/admin/tours/{id}',       function($params) { $admin = require_admin(); tours_delete($params, $admin); });

// Tours (agency)
$router->add('POST', '/api/agency/tours',      function() { $agency = require_agency(); tours_create($agency); });
$router->add('POST', '/api/upload/images', function() {
    $agency = require_agency();
    upload_images();
});
$router->add('GET',  '/api/agency/tours',      function() { $agency = require_agency(); tours_list_my($agency); });
$router->add('PUT',  '/api/agency/tours/{id}', function($params) { $agency = require_agency(); tours_update($params, $agency); });
$router->add('DELETE', '/api/agency/tours/{id}', function($params) { $agency = require_agency(); tours_delete($params, $agency); });

// Wishlist
$router->add('GET',    '/api/wishlist',      function() { $user = require_auth(); wishlist_list($user); });
$router->add('POST',   '/api/wishlist',      function() { $user = require_auth(); wishlist_add($user); });
$router->add('DELETE', '/api/wishlist/{id}', function($params) { $user = require_auth(); wishlist_remove($params, $user); });

// Bookings & Payment
$router->add('POST', '/api/bookings',        function() { $user = require_auth(); bookings_create($user); });
$router->add('GET',  '/api/bookings',        function() { $user = require_auth(); bookings_list($user); });
$router->add('GET',  '/api/bookings/{id}',   function($params) { $user = require_auth(); bookings_get($params, $user); });
$router->add('GET',  '/api/admin/bookings',  function() { $admin = require_admin(); bookings_list_admin($admin); });
$router->add('GET',  '/api/agency/bookings', function() { $agency = require_agency(); bookings_list_agency($agency); });
$router->add('POST', '/api/payments/pay',    function() { $user = require_auth(); payments_pay($user); });

// Support
$router->add('POST', '/api/support',                    function() { $user = null; try { $user = require_auth(); } catch (Throwable $e) {} support_create($user); });
$router->add('GET',  '/api/support/my',                 function() { $user = require_auth(); support_my($user); });
$router->add('GET',  '/api/admin/support',              function() { $admin = require_admin(); admin_support_list($admin); });
$router->add('POST', '/api/admin/support/{id}/reply',   function($params) { $admin = require_admin(); admin_support_reply($params, $admin); });

// Notifications
$router->add('GET',  '/api/notifications',              function() { $user = require_auth(); notifications_list($user); });
$router->add('POST', '/api/notifications/{id}/read',    function($params) { $user = require_auth(); notifications_mark_read($params, $user); });
$router->add('POST', '/api/admin/notifications/broadcast', function() { $admin = require_admin(); admin_notify_broadcast($admin); });

// Currency
$router->add('GET', '/api/currency/convert', function() { currency_convert(); });



// Dispatch
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

$pos = strpos($path, '/public');
if ($pos !== false) {
  $path = substr($path, $pos + strlen('/public'));
  if ($path === '') $path = '/';
}

$router->dispatch($method, $path);
