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

    public function getJobs()
    {
        $jobs = $this->getJenkinsResponse(
            'api/json/?tree=jobs[name,url,color,lastCompletedBuild[number,timestamp],lastBuild[actions[causes[*]],number,building]]',
            'ganbatte_jenkins_api_response_jobs.json'
        );
        $jobs = json_decode($jobs);
        $jobs = $jobs->jobs;
        
        $response = array();
        
        // Filter out jobs that aren't being monitored
        foreach($jobs as $job) {
            if(in_array($job->name, $this->monitored_jobs)) {
                array_push($response, $job);
            }
        }

        $this->injectUserEmailAddresses($response);

        return $response;
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
     * @param cache_identifier A unique identifier for this response, for use with caching
     * @return mixed
     */
    private function getJenkinsResponse($uri, $cache_identifier)
    {
        $jenkins_url = $this->getJenkinsUrl();

        $jenkins_response = null;

        // If caching is enabled, attempt to fetch a cached response
        if ($this->cache_timer) {
            $jenkins_response = $this->cache->fetch($cache_identifier);
        }

        // No cached response was found or caching is disabled, fetch it again
        if (!$jenkins_response) {
            $jenkins_response = file_get_contents($jenkins_url . $uri);

            // If caching is enabled, cache the response now
            if ($this->cache_timer) {
                $this->cache->save($cache_identifier, $jenkins_response, $this->cache_timer);
            }
        }

        return $jenkins_response;
    }

    private function injectUserEmailAddresses(&$jobs)
    {
        $obj = $this;

        array_walk($jobs, function(&$job) use ($obj) {

            // Don't inject anything if we don't even have a last build or actions
            if (!isset($job->lastBuild, $job->lastBuild->actions)) {
                return;
            }

            // Walk through actions
            array_walk($job->lastBuild->actions, function(&$action) use ($obj) {

                // Don't inject anything if we don't have causes
                if (!isset($action->causes)) {
                    return;
                }

                // If we do have causes, walk through them
                array_walk($action->causes, function(&$cause) use ($obj) {

                    // If the cause doesn't contain a user id, don't do anything
                    if (!isset($cause->userId)) {
                        return;
                    }

                    // If the cause did contain a user id, get the email and add it
                    $cause->userEmail = $obj->getUserEmailById($cause->userId);

                    // While we're at it, add a gravatar URL
                    $cause->userGravatar = $obj->getGravatarByEmail($cause->userEmail);

                });

            });

        });
    }

    public function getUserEmailById($user_id)
    {
        $user_info = $this->getJenkinsResponse(
            sprintf('user/%s/api/json/?tree=property[address]', $user_id),
            sprintf('ganbatte_jenkins_api_response_user_%s.json', $user_id)
        );
        $user_info = json_decode($user_info);

        $user_properties = $user_info->property;

        // Loop through properties until we get an address, if possible
        $user_address = null;
        foreach ($user_properties as $user_property) {
            if (!isset($user_property->address)) {
                continue;
            }

            $user_address = $user_property->address;
        }

        return $user_address;
    }

    public function getGravatarByEmail($email)
    {
        return sprintf('//gravatar.com/avatar/%s.png?s=50&d=identicon', md5(strtolower($email)));
    }
}