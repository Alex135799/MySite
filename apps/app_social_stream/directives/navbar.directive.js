(function () {

	angular
	  .module('mySocialStream')
	  .controller('socialCtrlNavbar', socialCtrlNavbar)
	  .directive('navbar', navbar)

	  /**
	   * @ngdoc directive
	   * @name navbar
	   * @restrict EA
	   *
	   * @description
	   * navbar html.
	   *
	   * @example
	   *                  <navbar />
	   */

	  function navbar() {

	  	return {
	  		restrict:'EA',
	  		templateUrl: '/app_social_stream/directives/navbar.template.html',
	  		controller: 'socialCtrlNavbar',
	  		controllerAs: 'vm',
	  		
	  		scope: {
	  			content: '=content',
	  			parameters: '=',
	  		}
	  	}
	  }
	
	socialCtrlNavbar.$inject = [ "facebook", "authentication", "$rootScope", "$http", "$window", "$routeParams", "$http", "$location" ]
	function socialCtrlNavbar(facebook, authentication, $rootScope, $http, $window, $routeParams, $http, $location) {
		var vm = this;
		
		access_token = '';
		
		vm.user = authentication.currentUser() || {};
		vm.foundGroup = false;
		vm.groupId = 1612692632367704;
		vm.hashtag = "glasses";
		vm.findGroup = findGroup;
		vm.addGroup = addGroup;
		vm.groupErr = "";
		vm.groupName = "";
		vm.groupPic = "";
		vm.groupIdChanged = groupIdChanged;
		vm.removeGroup = removeGroup;
		vm.findHash = findHash;
		vm.addHash = addHash;
		vm.hashtagChanged = hashtagChanged;
		vm.instaAuth = $location.hash().split("=")[$location.hash().split("=").length-1];
		
		function groupIdChanged(){
			vm.groupErr = "";
			vm.foundGroup = false;
		}
		
		function hashtagChanged(){
			vm.hashErr = "";
			vm.foundHash = false;
		}
		
		function removeGroup(groupName){
			console.log("NAME: "+groupName)
			if(vm.user.preferences){
				if(vm.user.preferences.fbGroupNames){
					//Does this name already exist?
					if(!!(vm.user.preferences.fbGroupNames.indexOf(groupName)+1)){
						var index = vm.user.preferences.fbGroupNames.indexOf(groupName)
						vm.user.preferences.fbGroupNames.splice(index, 1);
						vm.user.preferences.fbGroupIds.splice(index, 1);
					}else{
						console.log("something is wrong here Duplicate...")
					}
				}else{
					console.log("something is wrong here Names...")
				}
			}else{
				console.log("something is wrong here Pref...")
			}
			if(authentication.isLoggedIn()){
				var creds = {preferences:vm.user.preferences, email:vm.user.email};
				authentication
				.updatePreferences(creds)
				.error(function(err){
					vm.groupErr = err;
				})
				.then(function(){
					console.log("Updated Preferences");
					vm.user = authentication.currentUser();
					$rootScope.$broadcast("UpdatedPreferences", vm.user);
					$('#FBModal').modal('hide');
					//console.log("New User: "+JSON.stringify(user));
				});
			}else{
				console.log("Updated Preferences");
				$rootScope.$broadcast("UpdatedPreferences", vm.user);
			}
		}
		
		function findGroup(){
			var promiseApi = facebook.api('/'+vm.groupId+'?fields=cover,name');
			promiseApi.then(function(data){
				vm.groupName = data.name;
				if(data.cover){
					vm.groupPic = data.cover.source;
				}else{
					vm.groupPic = "";
				}
				vm.foundGroup = true;
				vm.groupErr = "";
			}, function(err){
				vm.foundGroup = false;
				vm.groupErr = "Group ID not found. Please try again.";
			});
		}
		
		function addGroup(){
			if(vm.user.preferences){
				if(vm.user.preferences.fbGroupIds){
					if(!!(vm.user.preferences.fbGroupIds.indexOf(vm.groupId)+1)){
						vm.groupErr = "You have already added this group.";
						return;
					}else{
						vm.user.preferences.fbGroupIds.push(vm.groupId);
					}
				}else{
					vm.user.preferences.fbGroupIds = [];
					vm.user.preferences.fbGroupIds.push(vm.groupId);
				}
				if(vm.user.preferences.fbGroupNames){
					vm.user.preferences.fbGroupNames.push(vm.groupName);
				}else{
					vm.user.preferences.fbGroupNames = [];
					vm.user.preferences.fbGroupIds.push(vm.groupName);
				}
			}else{
				vm.user.preferences = {fbGroupIds: [], fbGroupNames: []};
				vm.user.preferences.fbGroupIds.push(vm.groupId);
				vm.user.preferences.fbGroupNames.push(vm.groupName);
			}
			if(authentication.isLoggedIn()){
				var creds = {preferences:vm.user.preferences, email:vm.user.email};
				authentication
				.updatePreferences(creds)
				.error(function(err){
					vm.groupErr = err;
				})
				.then(function(){
					console.log("Updated Preferences");
					vm.user = authentication.currentUser();
					$rootScope.$broadcast("UpdatedPreferences", vm.user);
					$('#FBModal').modal('hide');
					//console.log("New User: "+JSON.stringify(user));
				});
			}else{
				console.log("Updated Preferences");
				$rootScope.$broadcast("UpdatedPreferences", vm.user);
			}
			$('#FBModal').modal('hide');
		}
		
		function findHash(){
			if(!vm.instaAuth){
				$window.location.href = "https://api.instagram.com/oauth/authorize/?client_id=a1d68979dac94f13ba591933bf8f23c1&redirect_uri=http://localhost:8090/social&response_type=token&scope=public_content"
			}else{
				/*instagramFactory.getMediaByTag({
			        tag:vm.hashtag,
			        count:20,
			        access_token:vm.instaAuth,
			    }).then(function(data){
			        console.info("media by tag", JSON.stringify(data));
			    });*/
				$http.jsonp(
					"https://api.instagram.com/v1/tags/"+vm.hashtag+"/media/recent",
		            {
		                method: 'GET',
		                params: {"access_token":vm.instaAuth,"callback":"JSON_CALLBACK","count":20},
		            }
		        ).then(function success(data){
		        	if(data.data.data[0]){
		        		vm.hashPic = data.data.data[0].images.standard_resolution.url;
		        		vm.foundHash = true;
		        	}else{
		        		vm.hashErr = "No Data found for this hashtag."
		        	}
			        console.info("media by tag", JSON.stringify(data));
			    }, function error(data){
			    	console.info("ERROR JSON: ", JSON.stringify(data));
			    });
				/*$http({
					method: "GET",
					crossDomain: true,
					url: "https://api.instagram.com/v1/tags/"+vm.hashtag+"/media?access_token="+vm.instaAuth,
					responseType: "jsonp"
				}).then(function success(data){
					console.log(JSON.stringify(data))
				}, function error(data){
					console.log(JSON.stringify(data))
				})*/
			}
		}
		
		function addHash(){
			
		}
		
	}

})();