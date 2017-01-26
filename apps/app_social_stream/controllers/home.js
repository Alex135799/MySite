(function() {
	
	angular.module('mySite').controller('socialCtrl', socialCtrl);

	socialCtrl.$inject = [ "$routeParams", "mySiteData", "facebook", "$rootScope", "$window", "Fullscreen", "$q", "authentication" ]
	function socialCtrl($routeParams, mySiteData, facebook, $rootScope, $window, Fullscreen, $q, authentication) {
		var vm = this;
		
		vm.fbData;
		vm.fbPic;
		vm.fbLoggedIn = true;
		vm.fbPhotoData = 'Retrieving Data...';
		vm.login = login;
		vm.nextPic = nextPic;
		vm.prevPic = prevPic;
		vm.isFullscreen = false;
		vm.autoPlay = false;
		vm.toggleFullScreen = toggleFullScreen;
		vm.toggleAutoPlay = toggleAutoPlay;
		vm.user = authentication.currentUser() || {};
		var globalPics = [];
		
		//-1 because it increments adding the first to the 0 slot
		var globalOn = -1;
		var fbPics = [];
		var groupPics = {};
		
		//dict key=groupID value=index of the pic we are on
		var onData = {};
		var latestUpdateTimes = {};
		var theatrePos = angular.element($('#theatre')).prop('offsetTop');
		var windowHeight = $(window).height();
		vm.remainingHeight = windowHeight - theatrePos - 100;
		var canFullscreen = Fullscreen.isSupported();
		
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
					nextPic();
				}
				callback();
			});
			promiseAutoPlay.then(function(data){
				if(vm.autoPlay){
					setTimeout(doAutoPlay, 3000);
				}
			}, function(err){
				alert('FAILED: '+ JSON.stringify(err));
			})
		}
		
		function updateGroupPics(isUpdate, message, attachmentURL, groupID, j){
			if(!isUpdate){
				groupPics[groupID].push({"message":message,"attachment":attachmentURL})
			}else{
				groupPics[groupID].splice(onData[groupID]+j+1, 0, {"message":message,"attachment":attachmentURL})
			}
		}
		
		function updateFeed(feedData, isUpdate, groupID){
			var data = feedData;
			//onData and groupPics
			if(!groupPics[groupID]){
				groupPics[groupID] = [];
			}
			if(!onData[groupID]){
				onData[groupID] = 0;
			}
			for(i=0;i<data.length;i++){
				var message = "";
				var post;
				if(!data[i].message && data[i].story){
					message = data[i].story;
				}else{
					message = data[i].message;
				}
				if(data[i].attachments != null){
					if(data[i].attachments.data[0].subattachments != null){
						//if(data[i].attachments.data[0].subattachments.data[0].media){
						var subdata = data[i].attachments.data[0].subattachments.data
						for(j=0;j<subdata.length;j++){
							if(subdata[j].media && subdata[j].media.image){
								updateGroupPics(isUpdate, message, subdata[j].media.image.src, groupID, j);
							}else{
								continue;
							}
						}
					}else{
						if(data[i].attachments.data[0].media && data[i].attachments.data[0].media.image){
							updateGroupPics(isUpdate, message, data[i].attachments.data[0].media.image.src, groupID, 0);
						}else{
							//This makes no media posts not show up!
							continue;
						}
					}
				}
			}
			vm.fbPhotoData = JSON.stringify(groupPics[groupID]);
			/*if(isUpdate && !vm.autoPlay){
				vm.fbData = groupPics[groupID][onData[groupID]+1];
				
			}else */if(!isUpdate){
				nextPic(true);
			}

		}
		function trollForGroupsUpdates(){
			//console.log("TROLLING......");
			if(vm.user.preferences && vm.user.preferences.fbGroupIds){
				var numGroups = vm.user.preferences.fbGroupIds.length;
				for(groupInd=0; groupInd<numGroups; groupInd++ ){
					var groupId = vm.user.preferences.fbGroupIds[groupInd];
					console.log("API: "+'/'+groupId+'?fields=feed{created_time,message,story,attachments},id')
					var promiseApi = facebook.api('/'+groupId+'?fields=feed{created_time,message,story,attachments},id')
					promiseApi.then(function(data){
						var groupIdInside = data.id;
						console.log("DATA::: "+JSON.stringify(data));
						latestGroupUpdateTime = moment(data.feed.data[0].created_time);
						if(latestUpdateTimes[groupIdInside]){
							if(latestUpdateTimes[groupIdInside].diff(latestGroupUpdateTime) < 0){
								var updates = [];
								var ind = 0;
								while(latestUpdateTimes[groupIdInside].diff(moment(data.feed.data[ind].created_time)) < 0){
									updates.push(data.feed.data[ind]);
									ind = ind + 1;
								}
								updateFeed(updates, true, groupIdInside);
								latestUpdateTimes[groupIdInside] = latestGroupUpdateTime;
							}else{
								//console.log("No Updates");
							}
						}else{
							var updates = [];
							for(i=data.feed.data.length-1;i>=0;i--){
								updates.push(data.feed.data[i]);
							}
							//alert(JSON.stringify(updates));
							updateFeed(updates, false, groupIdInside);
							latestUpdateTimes[groupIdInside] = latestGroupUpdateTime;
						}
						setTimeout(trollForGroupsUpdates, 1000 * 60 * 5);
					}, function(err){
						alert('FAILED: '+ JSON.stringify(err));
					})
				}
			}else{
				console.log("Please add social media source.")
			}
		}
		
		function findRightSizePic(arrOfPics){
			var i;
			if(document.getElementById('imgDiv')){
				var width = document.getElementById('imgDiv').clientWidth - 40;
				for(i=0;i<arrOfPics.length;i++){
					console.log("width: "+arrOfPics[i].width+" Page W: "+width);
					if(arrOfPics[i].width > width){
						continue;
					}else{
						return arrOfPics[i];
					}
				}
				return arrOfPics[i];
			}
			return "";
		}
		
		function nextPic(newGroup){
			console.log("GolbalONBefore: "+globalOn)
			console.log("GlobalPicsBefore: "+JSON.stringify(globalPics))
			if(globalPics.length > globalOn+1){
				if(newGroup){
					groupInd = Object.keys(onData).length -1;
					var groupID = vm.user.preferences.fbGroupIds[groupInd];
					vm.fbData = groupPics[groupID][onData[groupID]];
					globalPics.splice(globalOn+1, 0, vm.fbData);
					onData[groupID] = onData[groupID] + 1;
					globalOn++;
				}else{
					vm.fbData = globalPics[globalOn+1]
					globalOn++;
				}
			}else{
				console.log("onData: "+JSON.stringify(onData))
				if(newGroup){
					groupInd = Object.keys(onData).length -1;
				}else{
					groupInd = Math.floor(Math.random() * (Object.keys(onData).length));
				}
				console.log("groupInd: "+groupInd +" LENGTH: "+Object.keys(onData).length)
				var groupID = vm.user.preferences.fbGroupIds[groupInd];
				if(groupPics[groupID].length <= onData[groupID]){
					onData[groupID] = 0;
				}
				vm.fbData = groupPics[groupID][onData[groupID]];
				onData[groupID] = onData[groupID] + 1;
				globalOn++;
				globalPics[globalOn] = vm.fbData;
			}
			console.log("GlobalPicsAfter: "+JSON.stringify(globalPics))
			console.log("GolbalONAfter: "+globalOn)
		}
		
		function prevPic(){
			console.log("GolbalONBefore: "+globalOn)
			if(globalOn != 0){
				//if(globalPics.length > globalOn){
					vm.fbData = globalPics[globalOn-1]
					globalOn--;
				/*}else{
					globalPics[globalOn] = vm.fbData;
					vm.fbData = globalPics[globalOn-1]
					globalOn--;
				}*/
			}else{
				vm.err = "cannot go back further";
			}
			console.log("GolbalONAfter: "+globalOn)
		}
		
		function populatePic(fbPics){
			var promisePhotoApi = facebook.api('/'+fbPics[onData].id+'?fields=images');
			
			promisePhotoApi.then(function(data){
				vm.fbPic = findRightSizePic(data.images);
			}, function(err){
				alert('FAILED: '+ JSON.stringify(err));
			})
		}
		
		//calls populatePic ^ or alerts
		function getPics(){
			var promiseApi = facebook.api('/me/photos');
			
			promiseApi.then(function(data){
				//vm.fbPhotoData = JSON.stringify(data);
				fbPics = data.data;
				populatePic(fbPics);
			}, function(err){
				alert('FAILED: '+ JSON.stringify(err));
			})
		}
		
		//calls getPics ^ or alerts
		function login(){
			var promiseLogin = facebook.login({scope: 'public_profile,user_friends,email'});
			
			promiseLogin.then(function(data){
				getPics();
			}, function(err){
				alert('FAILED: '+ JSON.stringify(err));
			})
		}
		
		//calls getPics ^^ or login ^
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
		            	trollForGroupsUpdates();
		            }
					//getPics();
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
			trollForGroupsUpdates();
		})
		
		$rootScope.$on('UpdatedPreferences', function(event, data){
			//if(!vm.user.preferences){
			//	
			//}else{
			//	vm.user = data;
			//}
			vm.user = data;
			//alert(JSON.stringify(vm.user));
			trollForGroupsUpdates();
            //vm.user = authentication.currentUser();
		})

		vm.pageHeader = {
			title : "Welcome to Big Al's Social!",
			strapline : 'Where you get to see social media streams!'
		}

	}
})();
