<?php

namespace KalmanOlah\Jenkins;

class ApiProxy {
    private $app;

    private $cache;
    private $cache_timer;

    private $monitored_jobs;

    public function __construct(\Silex\Application $app) {
        $this->app = $app;

        $this->cache = $app['caches']['default'];
        $this->cache_timer = $app['config']['jenkins']['cache_timer'];

        $this->monitored_jobs = array();
        foreach ($this->app['config']['monitoring']['pages'] as $page) {
            foreach ($page['items'] as $item) {
                foreach ($item['jobs'] as $job) {
                    if (!in_array($job['name'], $this->monitored_jobs)) {
                        $this->monitored_jobs[] = $job['name'];
                    }
                }
            }
        } 
    }

    /**
     * Reads the configuration file and produces a jenkins url that's ready to go.
     * @return string
     */
    private function getJenkinsUrl()
    {
        $jenkins_location = $this->app['config']['jenkins']['location'];
        $jenkins_user = $this->app['config']['jenkins']['api_user'];
        $jenkins_token = $this->app['config']['jenkins']['api_token'];

        $jenkins_protocol = 'http';
        $jenkins_host = $jenkins_location;

        if(preg_match('/^(.*):\/\/(.*)$/', $jenkins_location, $matches)) {
            $jenkins_protocol = $matches[1];
            $jenkins_host = $matches[2];
        }

        $jenkins_host = rtrim($jenkins_host, '/') . '/';

        $jenkins_http_auth_string = '';
        if(!empty($jenkins_user) && !empty($jenkins_token)) {
            $jenkins_http_auth_string = $jenkins_user . ':' . $jenkins_token . '@';
        }

        $jenkins_url = $jenkins_protocol . '://' . $jenkins_http_auth_string . $jenkins_host;

        return $jenkins_url;
    }
    
    /**
     * Fetches a response from jenkins.
     * @param uri string The string that should be appended to the base jenkins url
     * @return mixed
     */
    private function getJenkinsResponse($uri)
    {
        $jenkins_url = $this->getJenkinsUrl();

        $jenkins_response = null;

        // If caching is enabled, attempt to fetch a cached response
        if ($this->cache_timer) {
            $jenkins_response = $this->cache->fetch('ganbatte_jenkins_api_response.json');
        }

        // No cached response was found or caching is disabled, fetch it again
        if (!$jenkins_response) {
            $jenkins_response = file_get_contents($jenkins_url . $uri);

            // If caching is enabled, cache the response now
            if ($this->cache_timer) {
                $this->cache->save('ganbatte_jenkins_api_response.json', $jenkins_response, $this->cache_timer);
            }
        }

        return $jenkins_response;
    }
    
    public function getJobs()
    {
        $jobs = $this->getJenkinsResponse('api/json/?tree=jobs[name,url,color,lastCompletedBuild[number,timestamp],lastBuild[actions[causes[*]],number,building]]');
        $jobs = json_decode($jobs);
        $jobs = $jobs->jobs;
        
        $response = array();
        
        // Filter out jobs that aren't being monitored
        foreach($jobs as $job) {
            if(in_array($job->name, $this->monitored_jobs)) {
                array_push($response, $job);
            }
        }

        return $response;
    }
}