(function() {
	
	angular.module('mySite').controller('socialCtrl', socialCtrl);

	socialCtrl.$inject = [ "$routeParams", "mySiteData", "facebook", "$rootScope", "$window", "Fullscreen", "$q", "authentication", "imageMan" ]
	function socialCtrl($routeParams, mySiteData, facebook, $rootScope, $window, Fullscreen, $q, authentication, imageMan) {
		var vm = this;
		
		vm.fbData;
		vm.fbLoggedIn = true;
		vm.nextPic = nextPic;
		vm.prevPic = prevPic;
		vm.isFullscreen = false;
		vm.autoPlay = false;
		vm.toggleFullScreen = toggleFullScreen;
		vm.toggleAutoPlay = toggleAutoPlay;
		vm.user = authentication.currentUser() || {};
		var theatrePos = angular.element($('#theatre')).prop('offsetTop');
		var windowHeight = $(window).height();
		vm.remainingHeight = windowHeight - theatrePos - 100;
		var canFullscreen = Fullscreen.isSupported();	
		var autoPlayWait = 3000;
		
		var promise = function (func) {
			var deferred = $q.defer ();

			func (function (response) {
				if (response && response.error) {
					deferred.reject (response);
				} else {
					deferred.resolve (response);
				}

				//$rootScope.$apply();
			});

			return deferred.promise;
		};
		
		function toggleFullScreen() {
			if(canFullscreen){
				vm.isFullscreen = !vm.isFullscreen;
			}else{
				alert("Your browser does not support this fullscreen, please update your browser.");
			}
		}
		
		function toggleAutoPlay(){
			vm.autoPlay = !vm.autoPlay;
			if(vm.autoPlay){
				doAutoPlay();
			}
		}
		
		function doAutoPlay(){
			var promiseAutoPlay = promise(function(callback) {
				if(vm.autoPlay){
					imageMan.nextPic();
				}
				callback();
			});
			promiseAutoPlay.then(function(data){
				if(vm.autoPlay){
					setTimeout(doAutoPlay, autoPlayWait);
				}
			}, function(err){
				alert('FAILED: '+ JSON.stringify(err));
			})
		}
		
		function nextPic(){
			imageMan.nextPic();
		}
		
		function prevPic(){
			imageMan.prevPic();
		}
		
		$rootScope.$on('fb.init', function (event, data){
			console.log("Event: "+JSON.stringify(data));
			var promiseLoginStatus = facebook.loginStatus();
			
			promiseLoginStatus.then(function(data){
				if(data.status === 'connected'){
					vm.fbLoggedIn = true;
					
					var user = authentication.currentUser();
		            if(authentication.isLoggedIn() && !user.fbid){
		            	addFBtoLogin(user);
		            }
		            if(vm.user.preferences){
		            	imageMan.setUser(vm.user);
		            	imageMan.setFBData(vm.fbData);
		    			imageMan.trollForGroupsUpdates();
		            }
		            
				}else{
					vm.fbLoggedIn = false;
				}
			}, function(err){
				alert('FAILED: '+ JSON.stringify(err));
			})
			
		})
		
		function addFBtoLogin(user){
			var promiseUserApi = facebook.api('/me/?fields=email,name,id');
        	promiseUserApi.then(function(data){
        		var creds = {name:data.name, id:data.id, fbemail:data.email, email:user.email};
        		authentication
        		.addFB(creds)
        		.error(function(err){
        			console.log(err)
        		})
        		.then(function(){
        			console.log("Added FB");
        			vm.user = authentication.currentUser();
        			imageMan.setUser(vm.user);
                    //console.log("New User: "+JSON.stringify(user));
        		});
        	}, function(err){
        		alert('FAILED: '+ JSON.stringify(err));
        	})
		}
		
		$rootScope.$on('fb.auth.login', function(event, data){
            var user = authentication.currentUser();
            
            if(authentication.isLoggedIn() && !user.fbid){
            	addFBtoLogin(user);
            }
            
			vm.fbLoggedIn = true;
			imageMan.setUser(vm.user);
			imageMan.setFBData(vm.fbData);
			imageMan.trollForGroupsUpdates();
		})
		
		$rootScope.$on('UpdatedPreferences', function(event, data){
			vm.user = data;
			//alert(JSON.stringify(vm.user));
			imageMan.setUser(vm.user);
			imageMan.setFBData(vm.fbData);
			imageMan.trollForGroupsUpdates();
            //vm.user = authentication.currentUser();
		})
		
		$rootScope.$on('UpdatedFBData', function(event, data){
			vm.fbData = data;
		})

		vm.pageHeader = {
			title : "Welcome to Big Al's Social!",
			strapline : 'Where you get to see social media streams!'
		}

	}
})();
