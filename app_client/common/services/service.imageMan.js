(function () {
  angular
    .module('mySite')
    .service('imageMan', imageMan);

  imageMan.$inject = [ "facebook", "$rootScope" ]
  function imageMan(facebook, $rootScope) {
	  
	  var fbData;
	  var globalPics = [];
	  //-1 because it increments adding the first to the 0 slot
	  var globalOn = -1;
	  var groupPics = {};
	  //dict key=groupID value=index of the pic we are on
	  var onData = {};
	  var latestUpdateTimes = {};
	  
	  function setFBData(fbDataInput){
		  fbData = fbDataInput
	  }
	  
	  function updateFeed(user, feedData, isUpdate, groupID){
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
			//fbPhotoData = JSON.stringify(groupPics[groupID]);
			if(!isUpdate){
				nextPic(user, true);
			}
		}
		function trollForGroupsUpdates(user){
			//console.log("TROLLING......");
			if(user.preferences && user.preferences.fbGroupIds){
				var numGroups = user.preferences.fbGroupIds.length;
				for(groupInd=0; groupInd<numGroups; groupInd++ ){
					var groupId = user.preferences.fbGroupIds[groupInd];
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
								updateFeed(user, updates, true, groupIdInside);
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
							updateFeed(user, updates, false, groupIdInside);
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
		
		function updateGroupPics(isUpdate, message, attachmentURL, groupID, j){
			if(!isUpdate){
				groupPics[groupID].push({"message":message,"attachment":attachmentURL})
			}else{
				groupPics[groupID].splice(onData[groupID]+j+1, 0, {"message":message,"attachment":attachmentURL})
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
	  
	  var nextPic = function(user, newGroup){
			console.log("GolbalONBefore: "+globalOn)
			console.log("GlobalPicsBefore: "+JSON.stringify(globalPics))
			if(globalPics.length > globalOn+1){
				if(newGroup){
					groupInd = Object.keys(onData).length -1;
					var groupID = user.preferences.fbGroupIds[groupInd];
					fbData = groupPics[groupID][onData[groupID]];
					globalPics.splice(globalOn+1, 0, fbData);
					onData[groupID] = onData[groupID] + 1;
					globalOn++;
				}else{
					fbData = globalPics[globalOn+1]
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
				var groupID = user.preferences.fbGroupIds[groupInd];
				if(groupPics[groupID].length <= onData[groupID]){
					onData[groupID] = 0;
				}
				fbData = groupPics[groupID][onData[groupID]];
				onData[groupID] = onData[groupID] + 1;
				globalOn++;
				globalPics[globalOn] = fbData;
			}
			$rootScope.$broadcast("UpdatedFBData", fbData);
			console.log("GlobalPicsAfter: "+JSON.stringify(globalPics))
			console.log("GolbalONAfter: "+globalOn)
		}
	  
	  var prevPic = function(){
			console.log("GolbalONBefore: "+globalOn)
			if(globalOn != 0){
				fbData = globalPics[globalOn-1]
				globalOn--;
			}else{
				err = "cannot go back further";
			}
			$rootScope.$broadcast("UpdatedFBData", fbData);
			console.log("GolbalONAfter: "+globalOn)
		}
    return {
    	prevPic : prevPic,
    	nextPic : nextPic,
    	trollForGroupsUpdates : trollForGroupsUpdates,
    	setFBData : setFBData,
    };
  }
})();
