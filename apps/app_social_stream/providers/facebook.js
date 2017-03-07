angular.module ('bnx.module.facebook', [])
  .provider ('facebook', facebookProvider);

facebookProvider.$inject = ['$injector'];
function facebookProvider ($injector) {
	this.initialized = false;
	var defaultParams = { appId: '', status: true, cookie: true, xfbml: true, version: 'v2.8' };
	var facebookEvents = {
			'auth': ['authResponseChange', 'statusChange', 'login', 'logout']
	};

	var Q = [];

	this.init = function (params) {
		window.fbAsyncInit = function() {
			angular.extend (defaultParams, params);
			FB.init(defaultParams);

			this.initialized = true;
			//console.log ("Facebook initialization done.");

			processPostInitializeQ ();
		};
	};

	function executeWhenInitialized (callback, self, args) {
		//console.log ("adding to Q: ", callback);
		Q.push ([callback, self, args]);
	};


	var processPostInitializeQ = function () {
		//console.log ('Processing Q messages.');
		while (item = Q.shift ()) {
			
			//console.log("Processing: "+ item[0]);
			
			func = item[0];
			self = item[1];
			args = item[2];

			func.apply (self, args);
		}
	};


	this.$get = ["$rootScope", "$q",  function ($rootScope, $q) {
		var promise = function (func) {
			//console.log("Promising");
			var deferred = $q.defer ();

			func (function (response) {
				if (response && response.error) {
					deferred.reject (response);
				} else {
					deferred.resolve (response);
				}

				$rootScope.$apply ();
			});

			return deferred.promise;
		};

		var registerEventHandlers = function () {
			//console.log("Registering Handlers");
			$rootScope.$broadcast("fb.init", {});
			angular.forEach (facebookEvents, function (events, domain) {
				//console.log("There are events: "+ events + ", "+ domain);
				angular.forEach (events, function (_event) {
					var msg = 'fb.' + domain + '.' + _event;
					//console.log("Subscribing: "+ msg);
					FB.Event.subscribe (domain + '.' + _event, function (response) {
						$rootScope.$broadcast(msg, response);
					});
				});
			});
		};

		var login = function (params) {
			//console.log("Executing Login Call");
			return promise (function (callback) {
				FB.login (function (response) {
					callback (response);
				}, params);
			});
		}
		
		var loginStatus = function() {
			//console.log("Checking Login Status");
			return promise (function (callback) {
				FB.getLoginStatus(function (response) {
					callback(response);
				});
			});
		}

		var api = function (path) {
			console.log("Executing Api Call");
			return promise (function (callback) {
				FB.api(path, function (response) {
					callback (response);
				});
			});
		}

		if (!this.initialized) {
			//console.log("Not Initialized")
			executeWhenInitialized (registerEventHandlers, this, []);
		} else {
			//console.log("Initialized")
			registerEventHandlers ();
		}

		var provider = this;
		return  {
			initialized: function () {
				return provider.initialized;
			},

			loginStatus: loginStatus,
			init: provider.init,
			api: api,
			login: login
		}
	}];
};