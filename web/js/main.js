(function($) {

    // Helper function to determine browser scrollbar width
    // All credit goes to Alexandre Gomes, http://www.alexandre-gomes.com/?p=115
    function getScrollBarWidth () {
      var inner = document.createElement('p');
      inner.style.width = "100%";
      inner.style.height = "200px";

      var outer = document.createElement('div');
      outer.style.position = "absolute";
      outer.style.top = "0px";
      outer.style.left = "0px";
      outer.style.visibility = "hidden";
      outer.style.width = "200px";
      outer.style.height = "150px";
      outer.style.overflow = "hidden";
      outer.appendChild (inner);

      document.body.appendChild (outer);
      var w1 = inner.offsetWidth;
      outer.style.overflow = 'scroll';
      var w2 = inner.offsetWidth;
      if (w1 == w2) w2 = outer.clientWidth;

      document.body.removeChild (outer);

      return (w1 - w2);
    };

    $(function(){
        // Determine what page we're on
        app.page = typeof app.page != 'undefined' ? app.page : 'any';
        
        // Monitoring page-specific
        if(app.page == 'index') {
        	// This is where we cache the autoprogress stuff
        	var autoprogress = null;
        	var autoprogress_state = null;
            var autoprogress_cookie = 'ganbatte_autoprogress_state';
            
            // ... and the autorefresh stuff
            var autorefresh = null;
            var autorefresh_state = null;
            var autorefresh_cookie = 'ganbatte_autorefresh_state';
        	
        	function setAutoProgress(state) {
    			autoprogress_state = state;
                // Set the autoprogress cookie to the opposite value
                $.cookie(autoprogress_cookie, autoprogress_state, { expires: 999, path: '/' });
        		
                if(autoprogress_state) {
                    $('.autoprogress-toggle').addClass('active').find('i').addClass('icon-pause').removeClass('icon-play');
                    autoprogress = setInterval(moveToNextGroup, app.progress_interval * 1000);
                }else {
                    $('.autoprogress-toggle').removeClass('active').find('i').removeClass('icon-pause').addClass('icon-play');
                    if(autoprogress != null) {
                    	clearInterval(autoprogress);
                    }
                }
            }
        	
        	function toggleAutoProgress() {
        		state = !autoprogress_state;
        		setAutoProgress(state);
        	}

            function initAutoProgress() {
                // First, check if we should enable auto progressing
                autoprogress_state = $.cookie(autoprogress_cookie) || true;
                // Convert string to bool
                autoprogress_state = typeof autoprogress_state == 'string' ? (autoprogress_state == 'true' ? true: false) : autoprogress_state;
                // Start automatically moving to the next group
                setAutoProgress(autoprogress_state);

                // Make sure we can toggle auto progress
                $('.autoprogress-toggle').click(toggleAutoProgress);
            }
            
        	function setAutoRefresh(state) {
    			autorefresh_state = state;
                // Set the autorefresh cookie to the opposite value
                $.cookie(autorefresh_cookie, autorefresh_state, { expires: 999, path: '/' });
        		
                if(autorefresh_state) {
                    $('.autorefresh-toggle').addClass('active').find('i').addClass('icon-spin');
                    autorefresh = setInterval(performDataRefresh, app.refresh_interval * 1000);
                }else {
                    $('.autorefresh-toggle').removeClass('active').find('i').removeClass('icon-spin');
                    if(autorefresh != null) {
                    	clearInterval(autorefresh);
                    }
                }
            }
        	
        	function toggleAutoRefresh() {
        		state = !autorefresh_state;
        		setAutoRefresh(state);
        	}

            function initAutoRefresh() {
                // First, check if we should enable auto refreshing
                autorefresh_state = $.cookie(autorefresh_cookie) || true;
                // Convert string to bool
                autorefresh_state = typeof autorefresh_state == 'string' ? (autorefresh_state == 'true' ? true: false) : autorefresh_state;
                // Start automatically refreshing
                setAutoRefresh(autorefresh_state);

                // Make sure we can toggle auto refresh
                $('.autorefresh-toggle').click(toggleAutoRefresh);
                
                // Perform one data refresh on page load, no matter what
                performDataRefresh();
            }
            
            function queueElementMoveToContainer($elem, container, building) {
            	$elem.data({
            		'container': container,
            		'building': building
            	});
            	
            	// Check if all sibling jobs in this item have similar data values set.
            	// If they do, it's time to actually execute the move.
            	var ready_to_move = true;
            	$elem.siblings().each(function() {
            		var $this = $(this);
            		var this_container = $this.data('container');
            		var this_building = $this.data('building');
            		if(typeof this_container == 'undefined' || typeof this_building == 'undefined') {
            			ready_to_move = false;
            		}
            	});
            	
            	if(ready_to_move) {
            		executeElementMoveToContainer($elem.parent().parent());
            	}
            }
            
            function executeElementMoveToContainer($elem) {
            	var container = 'disabled';
            	var move_to_top = false;
            	
            	$elem.find('.job').each(function() {
            		var $this = $(this);
            		
            		var this_container = $this.data('container');
            		var this_building = $this.data('building');
            		
            		// Failed stuff stays in the same block
            		if(container == 'failed') {
            			this_container = 'failed';
            		}else
            		// We can only move stuff to the disabled block if all jobs of the item are disabled
            		if(container != 'disabled' && this_container == 'disabled') {
            			this_container = container;
            		}
            		
            		container = this_container;
            		
            		// If we're building, we should move our element to the top of its element
            		if(this_building) {
            			move_to_top = true;
            		}
            		
            		// Remove data values
            		$this.removeData('container');
            		$this.removeData('building');
            		
            	});
            	        		
        		// If this element is already the within its container and we don't have to move stuff to the top, do nothing
            	if($elem.parent().hasClass('jobs-container-' + container) && !move_to_top) return;
            	// If we have to move stuff to the top, but this element is already the first element within its container, do nothing
            	if(move_to_top && $elem.parent().children()[0] == $elem[0]) return;
            	// If the container doesn't exist, do nothing
            	var $container = $elem.parent().parent().find('.jobs-container-' + container);
            	if(!$container.length) return;
            	// If this element is already being animated, do nothing
            	if($elem.is(':animated')) return;
            	// Fade out this element (but not completely, or we'd lose the space it occupied
            	$elem.animate({
            		'opacity': 0.000001,
            	}, function() {
            		// Next, animate height to 0
            		$elem.animate({
            			'height': 0
            		}, function() {
            			// Next, make this element the first child of its new container
            			$elem.prependTo($container);
            			// Now, animate the height again
            			$elem.animate({
            				'height': '999px'
            			}, function() {
            				// Finally, fade our element back in
            				$elem.animate({
            					'opacity': 1
            				});
            			});
            		});
            	});
            }
            
            function performDataRefresh() {
            	$.getJSON(app.basepath + app.jobs, function(data) {
            		if(data.length) {
            			/*
            			 * First, loop through all of our job containers. The container's 'title' attribute will tell us
            			 * what job we're looking for.
            			 */
            			$('.job').each(function() {
            				var $this = $(this);
            				var job = $this.data('job');
                            var trigger = $this.data('trigger');

            				// Only do stuff if there's a job to do stuff for
            				if(typeof job != 'undefined' && job.length > 0) {
            					// First, remove all classes that indicate statuses
            					$this.removeClass('animated').removeClass('success').removeClass('error').removeClass('disabled');
            					// Set default container to disabled, to be overriden if we can match the job
    							var container = 'disabled';
    							var building = false;
            					
            					// Loop through our received data, and look for an object with a name that matches our title
            					var matched = false;
            					$.each(data, function(key, val) {
            						if(val.name == job) {
            							matched = true;
            							
            							building = val.color.indexOf('_anime') != -1;
            							var color = val.color.replace('_anime', '');

            							switch(color){
            							case 'blue':
            								// Blue stands for passing builds and good things
            								$this.addClass('bar-success');
            								// Move this item to the neutral jobs container
            								container = 'neutral';
            								break;
            							case 'disabled':
            								$this.addClass('disabled');
            								break;
            							case 'red':
            								// Red is bad things
            								$this.addClass('bar-danger');
            								container = 'failed';
            								break;
            							case 'grey':
            								// Grey stuff has the info class for now
            								$this.addClass('bar-info');
            								container = 'neutral';
            								break;
            							}

                                        // Figure out the cause of this build
                                        var cause = null;
                                        for(var i = 0; i < val.lastBuild.actions.length; i++) {
                                            if (val.lastBuild.actions[i].causes) {
                                                cause = val.lastBuild.actions[i].causes[0];
                                                break;
                                            }
                                        }

                                        // If this job is running, has a trigger and the last(current) build was triggered by another job,
                                        // then we're only really building if the current build cause is a job that matches data-trigger
                                        if (building && typeof trigger != 'undefined' && trigger.length > 0) {
                                            if (cause.upstreamProject && cause.upstreamProject != trigger) {
                                                building = false;
                                            }
                                        }
            							
            							// If we're building, do some magic
            							if(building) {
            								$this.addClass('animated');
            							}

                                        // Display info about the last completed build
                                        if (val.lastCompletedBuild) {
                                            // Display the last build number
                                            $this.find('.job-lastbuild-number').html('#' + val.lastCompletedBuild.number);

                                            // Display the last build time
                                            $this.find('.job-lastbuild-time').html(BJSInstance.parse(val.lastCompletedBuild.timestamp / 1000));
                                        }

                                        // Display or hide info about a currently running build
                                        if (building && val.lastBuild && val.lastBuild.building) {
                                            // Display some basic info
                                            $this.find('.job-currentbuild-meta').html('#' + val.lastBuild.number);

                                            // The HTML we'll use to display the cause
                                            var cause_html = '';

                                            // Figure out the type of the cause (user, SCM or upstream build)
                                            if (cause.upstreamBuild) {
                                                cause_html = '<i class="icon-upload-alt"></i> Build #' + cause.upstreamBuild;
                                            } else if (cause.userName) {
                                                cause_html = '<i class="icon-user"></i> ' + cause.userName;
                                            } else {
                                                cause_html = '<i class="icon-code-fork"></i> SCM/misc';
                                            }

                                            $this.find('.job-currentbuild-cause').html(cause_html);

                                            $this.find('.job-currentbuild-info').fadeIn();

                                        } else {
                                            $this.find('.job-currentbuild-info').fadeOut();
                                        }
            						}
            					});
            					// If no matches were found within our data, this must mean something's broken or configured incorrectly.
            					if(!matched) {
            						$this.addClass('disabled');
            					}
            					
								queueElementMoveToContainer($this, container, building);
            				}
            			});
            		}
            	});	
            }

            function toggleSidebar(open) {
                if(open) {
                    $('.sidebar').removeClass('shrink');
                    $('.content').removeClass('expand');
                }else {
                    $('.sidebar').addClass('shrink');
                    $('.content').addClass('expand');
                }
            }

            function initSidebar() {
                var sidebar_cookie = 'ganbatte_sidebar_state';
                // First, check if we should start our sidebar opened
                var sidebar_state = $.cookie(sidebar_cookie) || false;
                // Convert string to bool
                sidebar_state = typeof sidebar_state == 'string' ? (sidebar_state == 'true' ? true : false) : sidebar_state;
                // Start up the sidebar toggler
                toggleSidebar(sidebar_state);

                // Make sure we can toggle our sidebar
                $('.sidebar-toggle').click(function(e) {
                    sidebar_state = !sidebar_state;
                    // Set the sidebar cookie to the opposite value
                    $.cookie(sidebar_cookie, sidebar_state, { expires: 999, path: '/' });
                    // Call the sidebar toggler
                    toggleSidebar(sidebar_state);
                });
            }

            function initTooltips() {
                $('[rel=tooltip]').tooltip();
            }
            
        	function fixSidebarDimensions() {
                var $sidebar_groups = $('.sidebar-groups');

                function fixSidebarHeight() {
                    // Calculate the desired height of the groups container
                    var height = ($(window).height() - $sidebar_groups.offset().top) + 'px';
                    // Set the height
                    $sidebar_groups.css('height', height);
                }

                function fixSidebarWidth() {
                    // Hide the scrollbar by settings a negative margin-right equal to the scrollbar width
                    var scrollbar_width = '-' + getScrollBarWidth() + 'px';
                    $sidebar_groups.css('margin-right', scrollbar_width);
                }

                $(window).resize(fixSidebarHeight);
                fixSidebarHeight();

                fixSidebarWidth();
        	}
        	
        	function switchToGroup(id) {
        		$('.sidebar-group').removeClass('active');
        		$('.sidebar-group.group-' + id) .addClass('active');
        		var $siblings = $('.group.group-' + id).siblings();
        		if($siblings.length) {
            		var first = false;
            		$('.group.group-' + id).siblings().each(function() {
            			if(!first) {
            				first = true;
            				$(this).fadeOut(function() {
            					$('.group.group-' + id).removeClass('invisible').fadeIn();
            				});
            			}else{
            				$(this).fadeOut();
            			}
            		});
        		}
        		$('.group.group-' + id).removeClass('invisible').fadeIn();
        	}
        	
        	function moveToNextGroup() {
        		var id = $('.sidebar-group.active').data('group-id');
        		var $next = $('.group.group-' + id).next();
        		if($next.length == 0) {
        			$next = $('.group').first();
        		}
        		var next = $next.data('group-id');
        		switchToGroup(next);
        	}
            
            function initSidebarGroups() {
            	fixSidebarDimensions();

            	// Make sure we can switch group views
            	$('.sidebar-group').click(function() {
            		if(typeof $(this).data('group-id') != 'undefined') {
                		// Manually moving to another group turns off autoprogress
                		setAutoProgress(false);
                		
            			switchToGroup($(this).data('group-id'));
            		}
            	});
            	
            	// Switch to the first group with items on page load
            	if($('.group').length) {
            		switchToGroup($('.group').first().data('group-id'));
            	}
            }

            // Init Beyond.JS
            BJSInstance = new BeyondJS();

            // Init tooltips
            initTooltips();
            // Init sidebar
            initSidebar();
            // Init sidebar groups
            initSidebarGroups();
            // Init auto-progress
            initAutoProgress();
            // Init auto-refresh
            initAutoRefresh();
        }
    });
})(jQuery);