/* RULES:
 * 1. Load groups if they exist in user preferences
 * 2. If a group is added then take all the pics after the current ind in globalPics,
 * 		Put them at the beginning of the list so the new groups are shown right away.
 * 3. If there is an update, take all the pics after the current ind in globalPics,
 * 		Put them at the beginning of the list so the new updates are shown right away.
 * 4. Load all data from the group right away even multiple pages.
 */



(function () {
  angular
    .module('mySite')
    .service('imageMan', imageMan);

  imageMan.$inject = [ "facebook", "$rootScope", "$http" ]
  function imageMan(facebook, $rootScope, $http) {
	  
	  var fbData;
	  var user;
	  var updates = {};
	  var globalPics = [];
	  //-1 because it increments adding the first to the 0 slot
	  var globalOn = -1;
	  var groupPics = {};
	  //dict key=groupID value=index of the pic we are on
	  var onData = {};
	  var latestUpdateTimes = {};
	  var latestUpdateTimesPre = {};
	  
	  function setFBData(fbDataInput){
		  fbData = fbDataInput
	  }
	  
	  function setUser(userInput){
		  user = userInput
	  }

	  function updateGroupPics(message, attachmentURL, groupID, j){
		  if(onData[groupID] === 'done'){
			  onData[groupID] = groupPics[groupID].length
			  groupPics[groupID].push({"message":message,"attachment":attachmentURL})
		  }else{
			  groupPics[groupID].splice(onData[groupID]+j+1, 0, {"message":message,"attachment":attachmentURL})
		  }
	  }
	  
	  function forceNewPicsNext(){
		  var globalPicsAfterCurrSpot = globalPics.slice(globalOn+1, globalPics.length);
		  var globalPicsBeforeCurrSpot = globalPics.slice(0, globalOn+1);
		  globalPics = globalPicsAfterCurrSpot.concat(globalPicsBeforeCurrSpot);
		  globalOn = globalPics.length-1;
	  }
	  
	  function procNextPageRec(data){
		  //console.log("HTTPDATA:: "+JSON.stringify(data))
		  var id = data.config.url.split("/")[4]
		  //console.log("HTTPDATA ID:: "+id)
		  var data = data.data
		  var ind = 0;
		  while(ind < data.data.length 
					&& latestUpdateTimes[id].diff(moment(data.data[ind].created_time)) < 0){
			  updates[id].push(data.data[ind]);
			  ind = ind + 1;
		  }
		  if(ind == data.data.length && ind > 0){
			  $http.get(data.paging.next).then(procNextPageRec)
		  }else{
			  //make it so that the new groups are forced to be next
			  forceNewPicsNext()

			  updateFeed(updates[id], id);
			  latestUpdateTimes[id] = latestUpdateTimesPre[id];
		  }
	  }

	  function updateFeed(feedData, groupID){
			var data = feedData;
			//onData and groupPics
			if(!groupPics[groupID]){
				groupPics[groupID] = [];
			}
			if(!onData[groupID]){
				onData[groupID] = -1;
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
								updateGroupPics(message, subdata[j].media.image.src, groupID, j);
							}else{
								continue;
							}
						}
					}else{
						if(data[i].attachments.data[0].media && data[i].attachments.data[0].media.image){
							updateGroupPics(message, data[i].attachments.data[0].media.image.src, groupID, 0);
						}else{
							//This makes no media posts not show up!
							continue;
						}
					}
				}
			}
			//fbPhotoData = JSON.stringify(groupPics[groupID]);
			if(onData[groupID] < 0){
				onData[groupID] = 0;
			}
			if(!fbData){
				nextPic();
			}
		}
	  
		function trollForGroupsUpdates(){
			console.log("TROLLING......");
			if(user.preferences && user.preferences.fbGroupIds){
				var numGroups = user.preferences.fbGroupIds.length;
				for(groupInd=0; groupInd<numGroups; groupInd++ ){
					var groupId = user.preferences.fbGroupIds[groupInd];
					console.log("API: "+'/'+groupId+'?fields=feed.limit(3){created_time,message,story,attachments},id')
					var promiseApi = facebook.api('/'+groupId+'?fields=feed.limit(3){created_time,message,story,attachments},id')
					promiseApi.then(function(data){
						var groupIdInside = data.id;
						//console.log("DATA::: "+JSON.stringify(data));
						latestGroupUpdateTime = moment(data.feed.data[0].created_time);
						//already added pics for this group
						if(latestUpdateTimes[groupIdInside]){
							//if there is an update
							if(latestUpdateTimes[groupIdInside].diff(latestGroupUpdateTime) < 0){
								updates[data.id] = [];
								var ind = 0;
								while(ind < data.feed.data.length 
										&& latestUpdateTimes[groupIdInside].diff(moment(data.feed.data[ind].created_time)) < 0){
									updates[data.id].push(data.feed.data[ind]);
									ind = ind + 1;
								}
								if(ind == data.feed.data.length && ind > 0){
									$http.get(data.feed.paging.next).then(procNextPageRec)
								}else if(ind > 0){
									//make it so that the new groups are forced to be next
									forceNewPicsNext()

									updateFeed(updates[data.id], data.id);
									latestUpdateTimes[data.id] = latestGroupUpdateTime;
								}
								
								latestUpdateTimesPre[groupIdInside] = latestGroupUpdateTime;
							}else{
								//console.log("No Updates");
							}
						//need to add pics for this group
						}else{
							updates[data.id] = [];
							latestUpdateTimes[groupIdInside] = moment("1950-03-17T00:00:00+0000")
							var ind = 0;
							while(ind < data.feed.data.length 
									&& latestUpdateTimes[groupIdInside].diff(moment(data.feed.data[ind].created_time)) < 0){
								updates[data.id].push(data.feed.data[ind]);
								ind = ind + 1;
							}
							if(ind == data.feed.data.length && ind > 0){
								$http.get(data.feed.paging.next).then(procNextPageRec)
							}else if(ind > 0){
								//make it so that the new groups are forced to be next
								forceNewPicsNext()

								updateFeed(updates[data.id], data.id);
								latestUpdateTimes[data.id] = latestGroupUpdateTime;
							}
							
							latestUpdateTimesPre[groupIdInside] = latestGroupUpdateTime;
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
	  
	  var nextPic = function(){
			console.log("GolbalONBefore: "+globalOn)
			console.log("GlobalPicsBefore: "+JSON.stringify(globalPics))
			//If globalPics knows the next pic
			if(globalPics.length > globalOn+1){
				/*if(newGroup){
					groupInd = Object.keys(onData).length -1;
					var groupID = user.preferences.fbGroupIds[groupInd];
					fbData = groupPics[groupID][onData[groupID]];
					globalPics.splice(globalOn+1, 0, fbData);
					onData[groupID] = onData[groupID] + 1;
					globalOn++;
				}else{*/
				fbData = globalPics[globalOn+1]
				globalOn++;
			//If we are at the end of all pics
			}else if(areAllGroupsFinished()){
				globalOn = 0;
				fbData = globalPics[globalOn]
			//If we need to add a pic to globalPics
			}else{
				console.log("onData: "+JSON.stringify(onData))
				/*if(newGroup){
					groupInd = Object.keys(onData).length -1;
				}else{*/
					
				//get a groupInd where the pics have not been finished
				do{
					groupInd = Math.floor(Math.random() * (Object.keys(onData).length));
				}while(onData[user.preferences.fbGroupIds[groupInd]] === 'done')
					
				console.log("groupInd: "+groupInd +" LENGTH: "+Object.keys(onData).length)
				var groupID = user.preferences.fbGroupIds[groupInd];
				fbData = groupPics[groupID][onData[groupID]];
				//If on the last pic for the group
				if(groupPics[groupID].length-1 == onData[groupID]){
					onData[groupID] = 'done';
				}else{
					onData[groupID] = onData[groupID] + 1;
				}
				globalOn++;
				globalPics[globalOn] = fbData;
			}
			$rootScope.$broadcast("UpdatedFBData", fbData);
			console.log("GlobalPicsAfter: "+JSON.stringify(globalPics))
			console.log("GolbalONAfter: "+globalOn)
		}
	  
	  var areAllGroupsFinished = function(){
		  var allGroupsFinished = true;
		  for(var groupID in onData){
			  if(onData[groupID] !== 'done'){
				  allGroupsFinished = false;
			  }
		  }
		  return allGroupsFinished;
	  }
	  
	  var prevPic = function(){
			console.log("GolbalONBefore: "+globalOn)
			if(globalOn != 0){
				fbData = globalPics[globalOn-1]
				globalOn--;
			}else{
				globalOn = globalPics.length-1
				fbData = globalPics[globalOn]
			}
			$rootScope.$broadcast("UpdatedFBData", fbData);
			console.log("GolbalONAfter: "+globalOn)
		}
    return {
    	prevPic : prevPic,
    	nextPic : nextPic,
    	trollForGroupsUpdates : trollForGroupsUpdates,
    	setFBData : setFBData,
    	setUser : setUser,
    };
  }
})();
