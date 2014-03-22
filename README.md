Ganbatte! Build Monitor
========================

This is a simple build monitor for Jenkins. When set up, it kind of looks like this:

![Ganbatte](https://raw.github.com/kalmanolah/ganbatte/master/screenshot.png)

Features:

- Supports build triggers, differentiating jobs based on the job triggering them
- Allows you to add one or multiple pages of pipeline items, with the ability to automatically rotate between pages (Can be toggled)
- Allows you to add one or multiple pipeline items per page, each with one or multiple monitored Jenkins CI jobs
- A fully responsive layout
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

v0.6.3

- Turn causes and build numbers into links to the related object
- No longer expose user's email addresses; No longer try to create gravatar URLs from null email addresses

v0.6.2

- Add support for unstable jobs..

v0.6.1

- Remove useless minified (old) files
- Add new version of Beyond.JS since the old one wasn't working in webkit-based browsers
- Clean up the font a bit

v0.6.0

- Remove Twitter bootstrap from assets. We were only using a few things from it anyway
- Add a script for minifying css & js assets
- Use minified assets in templates

v0.5.2

- Upgrade assets, remove twitter bootstrap js since we don't need it anyway, optimize some stuff and things
- Fix an issue with the viewport meta tag

v0.5.1

- Remove fadeout/fadein effect when data refreshes.. yet again

v0.5

- Actually start tagging releases
- Allow overriding of the cookie-set initial auto-refresh/auto-progress states by setting the $_GET variable `refresh` or `progress` to 1
- Add separator border to jobs, in order to differentiate between similar jobs more easily
- Re-enable fade effects
- Job titles are now clickable and linked to the jenkins job URL
- When a build is triggered by a user, attempt to show a gravatar for their email address
- Building items now once again take their rightful place right below failing items
- Various bugfixes

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
