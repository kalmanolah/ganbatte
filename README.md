Ganbatte! Build Monitor
========================

This is a simple build monitor for Jenkins. When set up, it kind of looks like this:

![Ganbatte](https://raw.github.com/kalmanolah/ganbatte/master/screenshot.png)

The original version of Ganbatte was a standalone [Symfony](http://symfony.com/) project, but has been discontinued in favor of using the [Silex Microframework](http://silex.sensiolabs.org/).

Documentation
-------------

To set up this application, copy the sample configuration file in  [/config/example.config.yml](config/example.config.yml) to `/config.config.yml`.

The meaning of each configuration variable should be blatantly obvious.

Deploying/setting up
--------------------

You'll need Composer in order to actually get this project to work. Don't forget to edit your configuration file as shown in the section above.

    curl -sS https://getcomposer.org/installer | php
    php composer.phar install

After you've done these things, you can visit `/web` and gaze upon the application.

License
-------

MIT. See [LICENSE](LICENSE).

Credits
-------

A bunch of third party resources were used in the creation of this application. All credit goes to their original creators.