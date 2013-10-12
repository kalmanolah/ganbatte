Ganbatte! Build Monitor
========================

This is a simple build monitor for Jenkins. When set up, it kind of looks like this:

![Ganbatte](https://raw.github.com/kalmanolah/ganbatte/master/screenshot.png)

Features:

- Supports build triggers, differentiating jobs based on the job triggering them
- Allows you to add one or multiple pages of pipeline items, with the ability to automatically rotate between pages (Can be toggled)
- Allows you to add one or multiple pipeline items per page, each with one or multiple monitored Jenkins CI jobs
- A fully responsive layout based on Twitter Bootstrap
- Automatic repositioning of pipeline items with only disabled jobs to the bottom and pipeline items with failing jobs to the top, so you can immediately pick up on a failing build
- Animations and additional information for builds in progress
- Automatic refreshing of data at a configurable interval (Can be toggled)

This application makes use of the [Silex Microframework](http://silex.sensiolabs.org/).

Documentation
-------------

To set up this application, copy the sample configuration file in  [/config/example.config.yml](config/example.config.yml) to `/config/config.yml`.

The meaning of each configuration variable should be obvious.

Deploying/setting up
--------------------

You'll need Composer in order to actually get this project to work. Don't forget to edit your configuration file as shown in the section above.

    curl -sS https://getcomposer.org/installer | php
    php composer.phar install

After you've done these things, you can visit `/web` and spaz out.

License
-------

MIT. See [LICENSE](LICENSE).

Credits
-------

A bunch of third party resources were used in the creation of this application. All credit goes to their original creators.

Changelog
---------

v0.4

- Jenkins API responses can now be cached for a few seconds, using APC if it is enabled and falling back to filesystem caching if it is not
- Compiled twig templates are now cached in `APP_ROOT/cache/twig/` (so please make sure php can create and/or write to that folder)
- Follow the coding standards, I suppose

v0.3

- Completely redo javascript code: we use backbone.js and underscore.js now; I managed to make the js about 100 lines smaller this time!
- Upgrade Twitter bootstrap 2 to Twitter bootstrap 3
- All options that are persisted using cookies are now disabled by default until you click the corresponding button (this means progressing, refreshing and sidebar opening)
- Add support for page images: now I can finally display some logos
- General bugfixing / cleanup / layout and css fixes

v0.2

- Add support for build triggers, allowing you to re-use the same job and differentiate them based on the job that triggers them. For more information, see `config/example.config.yml`
- Show information about the currently running build, such as cause/instigator and build number
- Display information about the last successful build, such as build time and build number
- Start keeping a changelog ¯\\_(ツ)_/¯

v0.1

- Port old version of Ganbatte, use the Silex microframework instead of the full Symfony2 framework