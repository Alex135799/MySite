(function() {
	
	angular.module('mySocialStream',[ 'bnx.module.facebook', 'ui.bootstrap', 'ngRoute', 'jtt_instagram' ])
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

	angular.module('mySocialStream', [ 'mySite', 'bnx.module.facebook', 'ngTouch', 'FSAngular', 'toggle-switch', 'jtt_instagram' ])
	  .config([ '$routeProvider', '$locationProvider', 'facebookProvider', config ]);

})();