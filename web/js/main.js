(function($) {
    // Helper function to determine browser scrollbar width
    function getScrollBarWidth() {
        if (typeof _browser_scrollbar_width != 'undefined') {

            return _browser_scrollbar_width;
        }

        var $inner = $('<p style="width:100%;height:200px;"></p>');
        var $outer = $('<div style="position:absolute;top:0;left:0;visibility:hidden;width:200px;height:150px;overflow:hidden;"></div>');

        $inner.appendTo($outer);
        $outer.appendTo('body');

        var inner = $inner[0];
        var outer = $outer[0];

        var w1 = inner.offsetWidth;
        outer.style.overflow = 'scroll';
        var w2 = inner.offsetWidth;
        if (w1 == w2) w2 = outer.clientWidth;

        document.body.removeChild(outer);

        _browser_scrollbar_width = (w1 - w2);

        return _browser_scrollbar_width;
    };

    // Initializes Bootstrap tooltips
    function initTooltips() {
        $('[rel="tooltip"]').tooltip();
    }

    // Renders a template with some variables and puts the resulting html in a container
    function renderElement(identifier, variables) {
        var template = _.template($(identifier + '-template').html(), variables);
        $(identifier).html(template);
    }

    // Fetches a variable from a cookie
    function getVariable(key, defValue) {
        return $.cookie('ganbatte_' + key) || defValue;
    }

    // Fetches a boolean from a cookie
    function getBoolean(key, defValue) {
        var value = getVariable(key, defValue);
        if (typeof value == "string") {

            return value == "true";
        }

        return value;
    }

    // Sets a variable to a cookie
    function setVariable(key, value) {
        $.cookie('ganbatte_' + key, value, { expires: 999, path: '/' });
    }

    // Switches to a page
    function switchToPage(page) {
        $('.sidebar-page[data-page-id="' + page.get('id') + '"]')
            .addClass('active')
            .parent().siblings().find('a').removeClass('active');

        _selected_page = page;
    }

    // Progresses to the next page
    function progressToNextPage() {
        var active_id = _selected_page.get('id');
        var next_id = _page_list.models.length == active_id + 1 ? 0 : active_id + 1;
        switchToPage(_page_list.models[next_id]);
        _page_view.render();
    }

    // Refreshes the application data
    function refreshData() {
        $.getJSON(app.basepath + app.data_path, function(data) {
            // Reset statuses of items
            $.each(_item_list.models, function(key, item) {
                item.resetStatus();
            });
            // Update jobs
            $.each(data, function(k, job) {
                var jobs_orig = _job_list.where({ 'name': job.name });

                var building = job.color.indexOf('_anime') != -1;
                job.color = job.color.replace('_anime', '');
                job.building = building;

                var statuses = {
                    blue:     'success',
                    disabled: 'disabled',
                    red:      'failed',
                    grey:     'pending'
                };
                var status = statuses[job.color];
                job.status = status;

                var labels = {
                    success:  'success',
                    disabled: 'disabled',
                    failed:   'danger',
                    pending:  'info'
                };
                var label = labels[job.status];
                job.label = label;

                // Figure out the cause of this build
                var cause = null;
                if (job.building) {
                    for(var i = 0; i < job.lastBuild.actions.length; i++) {
                        if (job.lastBuild.actions[i].causes) {
                            cause = job.lastBuild.actions[i].causes[0];
                            break;
                        }
                    }
                }

                job.cause = cause;

                $.each(jobs_orig, function(key, job_orig) {
                    job_orig.set(job);
                    // If this job is running, has a trigger and the last(current) build was triggered by another job,
                    // then we're only really building if the current build cause is a job that matches the trigger
                    if (job.building && typeof job_orig.get('trigger') != 'undefined') {
                        if (job.cause.upstreamProject && job.cause.upstreamProject != job_orig.get('trigger')) {
                            job_orig.set({ building: false });
                        }
                    }

                    var item = job_orig.get('item');
                    // Set the status of the item this job is part of based on this job's status
                    if (item.get('status')) {
                        // We only want to override the status if it is not set to "failed"
                        if (item.get('status') != "failed") {
                            // If the item is set to disabled
                            if ((item.get('status') == 'disabled')
                                // OR if the item is set to pending and the job is not disabled
                                || (item.get('status') == 'pending' && job.status != 'disabled')
                                // OR if the job is failing
                                || job.status == 'failed'
                            ) {
                                // Override the status
                                item.set({ status: job.status });
                            }
                        }
                    } else {
                        // If the item has no status yet, just give it this job's status
                        item.set({ status: job.status });
                    }
                });
            });
            // Render the main page view
            _page_view.render();
        });
    }

    // Basic models
    var Job  = Backbone.Model.extend({
        defaults: {
            building: false,
            status:   'disabled'
        }
    });
    var Item = Backbone.Model.extend({
        resetStatus: function() {
            this.set({ status: null });
        }
    });
    var Page = Backbone.Model.extend();

    // Job list
    var JobList = Backbone.Collection.extend();

    // Item list
    var ItemList = Backbone.Collection.extend({
        // Returns all items, ordered by status
        // ORDER: failed > success > pending > disabled
        getOrdered: function() {
            return $.merge(
                this.where({ status: 'failed' }),
                this.where({ status: 'success' }),
                this.where({ status: 'pending' }),
                this.where({ status: 'disabled' })
            );
        }
    });

    // Page view
    var PageView = Backbone.View.extend({
        el: '.content-inner',
        render: function() {
            this.$el.fadeOut(function() {
                renderElement('.content-inner', { page: _selected_page });
                _page_view.$el.fadeIn();
            });
            // All that fading was getting annoying
            //renderElement('.content-inner', { page: _selected_page });
        }
    });

    // Page list
    var PageList = Backbone.Collection.extend();

    // Main application model, stores configuration
    var Ganbatte = Backbone.Model.extend({
        defaults: {
            progress:          getBoolean('progress', false),
            progress_interval: null,
            refresh:           getBoolean('refresh', false),
            refresh_interval:  null,
            sidebar:           getBoolean('sidebar', false)
        },
        toggleBool: function(key) {
            var value = !this.get(key);
            this.set(key, value);
            setVariable(key, value);
        }
    });

    // Main application view
    var GanbatteView = Backbone.View.extend({
        el: 'body',
        initialize: function() {
            // Listen to changes to the application
            this.listenTo(this.model, 'change:progress', this.renderSidebar);
            this.listenTo(this.model, 'change:refresh', this.renderSidebar);
            this.listenTo(this.model, 'change:sidebar', this.renderSidebar);
            // Perform an initial render on page load
            this.renderSidebar();
            // Initialize refreshing and progressing
            this.doProgress();
            this.doRefresh();
            // We need to fix the dimensions of the sidebar when the window is resized
            $(window).on("resize", this.fixSidebarDimensions);
            // Perform initial refresh
            refreshData();
        },
        events: {
            'click .progress-toggle': 'toggleProgress',
            'click .refresh-toggle':  'toggleRefresh',
            'click .sidebar-toggle':  'toggleSidebar',
            'click .sidebar-page':    'clickPage'
        },
        toggleProgress: function() {
            this.model.toggleBool('progress');
            this.doProgress();
        },
        doProgress: function() {
            if (this.model.get('progress')) {
                this.model.set('progress_interval', setInterval(progressToNextPage, app.progress_interval * 1000));
            } else {
                clearInterval(this.model.get('progress_interval'));
            }
        },
        toggleRefresh: function() {
            this.model.toggleBool('refresh');
            this.doRefresh();
        },
        doRefresh: function() {
            if (this.model.get('refresh')) {
                this.model.set('refresh_interval', setInterval(refreshData, app.refresh_interval * 1000));
            } else {
                clearInterval(this.model.get('refresh_interval'));
            }
        },
        toggleSidebar: function() {
            this.model.toggleBool('sidebar');
        },
        clickPage: function(ev) {
            // Switching pages manually should disable auto-progressing
            // If we don't do this, we might be overlapping fade animations, and that's annoying as hell
            this.model.set({ 'progress': false });
            this.doProgress();

            var page_id = $(ev.currentTarget).data('page-id');
            var page = this.model.get('pages').models[page_id];
            switchToPage(page);
            _page_view.render();
        },
        fixSidebarDimensions: function() {
            var $pages = $('.sidebar-pages');
            // Calculate the desired height of the page container
            var height = ($(window).height() - $pages.offset().top) + 'px';
            // Set the height
            $pages.css('height', height);

            // Hide the scrollbar by settings a negative margin-right equal to the scrollbar width
            var scrollbar_width = '-' + getScrollBarWidth() + 'px';
            $pages.css('margin-right', scrollbar_width);
        },
        renderSidebar: function() {
            renderElement('.sidebar-header', { ganbatte: this.model });
            renderElement('.sidebar-pages', { ganbatte: this.model });
            
            if (this.model.get('sidebar')) {
                this.$el.removeClass('sidebar-shrunk');
            } else {
                this.$el.addClass('sidebar-shrunk');
            }

            // We need to fix the sidebar upon rendering the sidebar
            this.fixSidebarDimensions();
        }
    });

    $(function() {
        initTooltips();

        // Init Beyond.JS
        BJSInstance = new BeyondJS();

        _job_list  = new JobList();
        _item_list = new ItemList();
        _page_list = new PageList();

        // Load initial data
        $.each(app.pages, function(k, page) {
            var p = new Page();
            var items = new ItemList();
            $.each(page.items, function(k, item) {
                var i = new Item();
                var jobs = [];
                $.each(item.jobs, function(k, job) {
                    var j = new Job($.extend(job, { item: i }));
                    _job_list.add(j);
                    jobs.push(j);
                });
                i.set($.extend(item, { jobs: jobs, page: p }));
                items.add(i);
                _item_list.add(i);
            });
            p.set($.extend(page, { items: items, id: k }));
            _page_list.add(p);
        });

        _page_view = new PageView();
        _selected_page = _page_list.models[0];

        var ganbatte = new Ganbatte({ pages: _page_list });
        var ganbatte_view = new GanbatteView({ model: ganbatte });

        // Select the first page by default
        switchToPage(_selected_page);

    });
})(jQuery);