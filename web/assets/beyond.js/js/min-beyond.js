BeyondJS=function(a){this.cfg={future:false,now:null,locale:{s:"second",S:"seconds",m:"minute",M:"minutes",h:"hour",H:"hours",d:"day",D:"days",w:"week",W:"weeks",mo:"month",MO:"months",y:"year",Y:"years","default":"just now",past:"ago",future:"from now"}};this.map=[["31536000","y"],["2678400","mo"],["604800","w"],["86400","d"],["3600","h"],["60","m"],["1","s"]];if(a){for(arg in a){this.cfg[arg]=a[arg]}}this.parse=function(b){if(b==null||b==""){return null}if(!isNaN(b-0)){return this.parseUnix(b)}try{var f=new Date(b)}catch(c){return null}return this.parseUnix(Math.round(f.getTime()/1000))};this.parseUnix=function(f){var d=this.cfg.now||Math.round(new Date().getTime()/1000);var g=f-d;if(g>0&&!this.cfg.future){return null}var b=Math.abs(g);var h=0;var c="";for(var e=0;e<this.map.length;e++){var j=this.map[e];if(b>=j[0]){h=Math.floor(b/j[0]);c=j[1];break}}if(h==0){return this.cfg.locale["default"]}else{if(h>1){c=c.toUpperCase()}}return h+" "+this.cfg.locale[c]+" "+this.cfg.locale[(g<0?"past":"future")]}};