/**
 * Beyond.JS v1.0.3, by Kalman Olah (http://kalmanolah.net)
 *
 * Beyond.JS is a simple Javascript library intended for the conversion of absolute timestamps
 * into relative timestamps. It was created as a lightweight alternative for similar libraries,
 * but without the need for jQuery.
 *
 * This script is free for both personal and commercial use.
 */

/*
 * Constructor function
 *
 * ARGUMENTS
 * =========
 * future    boolean    Whether to allow time differences in the future; defaults to true
 * now       number     Timestamp representing current time; defaults to current time
 * locale    object     An object containing custom locale strings
 */
BeyondJS = function(args) {
    // Configuration variable container
    this.cfg = {
        "future": false,
        "now":    null,
        "locale": {
            s:         "second",
            S:         "seconds",
            m:         "minute",
            M:         "minutes",
            h:         "hour",
            H:         "hours",
            d:         "day",
            D:         "days",
            w:         "week",
            W:         "weeks",
            mo:        "month",
            MO:        "months",
            y:         "year",
            Y:         "years",
            'default': "just now",
            'past':    "ago",
            'future':  "from now"
        }
    };

    // Diff boundary to locale string mapping
    this.map = [
        ['31536000', 'y'],
        ['2678400', 'mo'],
        ['604800', 'w'],
        ['86400', 'd'],
        ['3600', 'h'],
        ['60', 'm'],
        ['1', 's']
    ];

    // Overwrite the default config with any custom configuration values
    if (args) {
        for (arg in args) {
            this.cfg[arg] = args[arg];
        }
    }

    /*
     * Main parser function
     *
     * ARGUMENTS
     * =========
     * timestamp    mixed    A timestamp to parse
     */
    this.parse = function(timestamp) {
        // If the timestamp isn't set or is an empty string, return null
        if (timestamp == null || timestamp == "") {
            return null;
        }

        // If the timestamp is a UNIX timestamp, return a parsed string
        if (!isNaN(timestamp - 0)) {
            return this.parseUnix(timestamp);
        }

        // Try to create a Date object with the timestamp if it's not a UNIX timestamp
        try {
            var d = new Date(timestamp);
        } catch (e) {
            return null;
        }

        // If a Date object has been created, return a parsed string using the Date object's UNIX timestamp
        return this.parseUnix(Math.round(d.getTime() / 1000));
    };


    /*
     * Unix timestamp parser function
     *
     * ARGUMENTS
     * =========
     * timestamp    number    A unix timestamp to parse
     */
    this.parseUnix = function(timestamp) {
        // Set present time to timestamp from constructor, or present time if not set
        var now = this.cfg.now || Math.round(new Date().getTime() / 1000);

        var diff = timestamp - now;

        // If the difference in time lies in the future and is not allowed, stop running
        if (diff > 0 && !this.cfg.future) {
            return null;
        }

        // Get the absolute value of the difference in time
        var abs = Math.abs(diff);

        // Unit amount (X seconds, X minutes, etc.)
        var str = 0;

        // Unit locale string (second, seconds, minute, etc.)
        var end = "";

        for (var i = 0; i < this.map.length; i++) {
            var boundary = this.map[i];

            if (abs >= boundary[0]) {
                str = Math.floor(abs / boundary[0]);
                end = boundary[1];

                break;
            }
        }

        // If the time difference is less than a second, return the default string
        if (str == 0) {
            return this.cfg.locale["default"];
        } else if (str > 1) {
            end = end.toUpperCase();
        }

        // Return the string, complete with suffix
        return str + " " + this.cfg.locale[end] + " " + this.cfg.locale[(diff < 0 ? "past" : "future")];
    };
};
