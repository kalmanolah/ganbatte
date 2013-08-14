<?php

namespace KalmanOlah\Jenkins;

class ApiProxy {
    private $app;

    private $jenkins_location;
    private $jenkins_api_user;
    private $jenkins_api_token;

    private $monitored_jobs;

    public function __construct(\Silex\Application $app) {
        $this->app = $app;

        $this->jenkins_location = $this->app['config']['jenkins']['location'];
        $this->jenkins_api_user = $this->app['config']['jenkins']['api_user'];
        $this->jenkins_api_token = $this->app['config']['jenkins']['api_token'];

        $this->monitored_jobs = [];
        foreach ($this->app['config']['monitoring']['groups'] as $group) {
            foreach ($group['items'] as $item) {
                foreach ($item['jobs'] as $job) {
                    if (is_array($job)) {
                        $job = $job['job'];
                    }
                    if (!in_array($job, $this->monitored_jobs)) {
                        $this->monitored_jobs[] = $job;
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
        $jenkins_host = $this->jenkins_location;
        
        if(preg_match('/^(.*):\/\/(.*)$/', $jenkins_location, $matches)) {
            $jenkins_protocol = $matches[1];
            $jenkins_host = $matches[2];
        }
        
        $jenkins_host = rtrim($jenkins_host, '/') . '/';
        
        $jenkins_http_auth_string = '';
        if(!empty($this->jenkins_api_user) && !empty($this->jenkins_api_token)) {
            $jenkins_http_auth_string = $this->jenkins_api_user . ':' . $this->jenkins_api_token . '@';
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
        $jenkins_response = file_get_contents($jenkins_url . $uri);
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