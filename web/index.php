<?php
// Define root of the application as a named constant
define('APP_ROOT', __DIR__.DIRECTORY_SEPARATOR.'..'.DIRECTORY_SEPARATOR);

require_once APP_ROOT.'vendor/autoload.php';

$app = new Silex\Application();
$app->register(new DerAlex\Silex\YamlConfigServiceProvider(APP_ROOT.'config/config.yml'));

// Initialize Twig
$app->register(new Silex\Provider\TwigServiceProvider(), array(
    'twig.path'    => APP_ROOT.'views',
    'twig.options' => array(
        'cache'        => APP_ROOT.'cache/twig/',
    ),
));

// Initialize caching handler
$app->register(new \CHH\Silex\CacheServiceProvider, array(
    'cache.options' => array(
        'default'       => array(
            'driver'        => function() {
                // If APC is installed, use it
                if (extension_loaded('apc')) {
                   $apc = new \Doctrine\Common\Cache\ApcCache();
                   return $apc;
                }

                // If APC is not available, use filesystem caching
                $fsc = new \Doctrine\Common\Cache\FilesystemCache(APP_ROOT.'cache/jenkins/');
                return $fsc;
            }
        ),
    ),
));

// Set debug to true if viewing locally
if (in_array($_SERVER['REMOTE_ADDR'], array('127.0.0.1'))) {
    $app['debug'] = true;
}

/**
 * Route: / => Front page
 */
$app->get('/', function() use ($app) {
    // Allow adding progress=1 or refresh=1 to the URI to override the cookie-based
    // auto-progress or auto-refresh setting on page load
    $progress_override = array_key_exists('progress', $_GET) ? !! $_GET['progress'] : false;
    $refresh_override  = array_key_exists('refresh', $_GET) ? !! $_GET['refresh'] : false;

    return $app['twig']->render('index.html.twig', array(
        'progress_override' => $progress_override,
        'refresh_override'  => $refresh_override,
    ));
});

/**
 * Route: /data => Jenkins API Proxy & Data feed
 */
$app->get('/data', function() use ($app) {
    $proxy = new \KalmanOlah\Jenkins\ApiProxy($app);
    $jobs = $proxy->getJobs();

    return $app->json($jobs);
});

$app->run();
