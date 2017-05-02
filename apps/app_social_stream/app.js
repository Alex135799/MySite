(function() {
	
	angular.module('mySocialStream',[ 'bnx.module.facebook', 'ui.bootstrap', 'ngRoute' ])
	  .value('bowser', bowser);

	function config($routeProvider, $locationProvider) {
		$routeProvider.when('/social', {
			templateUrl : '/app_social_stream/views/home.html',
			controller : 'socialCtrl',
			controllerAs : 'vm'
		}).otherwise({
			redirectTo : '/'
		});

		$locationProvider.html5Mode({
			enabled : true,
			requireBase : false
		});
	}

	angular.module('mySocialStream', [ 'mySite', 'bnx.module.facebook', 'ngTouch', 'FSAngular', 'toggle-switch' ])
	  .config([ '$routeProvider', '$locationProvider', 'facebookProvider', config ]);

})();