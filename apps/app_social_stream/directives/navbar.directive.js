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
	
	socialCtrlNavbar.$inject = [ "facebook", "authentication", "$rootScope" ]
	function socialCtrlNavbar(facebook, authentication, $rootScope) {
		var vm = this;
		
		vm.user = authentication.currentUser() || {};
		vm.foundGroup = false;
		vm.groupId = 1612692632367704;
		vm.findGroup = findGroup;
		vm.addGroup = addGroup;
		vm.groupErr = "";
		vm.groupName = "";
		vm.groupPic = "";
		vm.groupIdChanged = groupIdChanged;
		vm.removeGroup = removeGroup;
		
		function groupIdChanged(){
			vm.groupErr = "";
			vm.foundGroup = false;
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
	}

})();