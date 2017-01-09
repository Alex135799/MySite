(function () {

	angular
	  .module('bnx.module.facebook')
	  .directive('facebook', facebook)

	  /**
	   * @ngdoc directive
	   * @name facebook
	   * @restrict EA
	   *
	   * @description
	   * Facebook initialization directive.
	   *
	   * @param {string} appId Facebook app id.
	   *
	   * @param {object} parameters initialization parameters, for details refer to init function
	   *                 description.
	   * @example
	   *                  <facebook app-id="123456"></facebook>
	   */

	  facebook.$inject = ['$location', 'facebook'];
	  function facebook($location, facebook) {
	  	//var template = "<div id='fb-root'></div>";

	  	var script = document.createElement('script');
	  	script.src = "//connect.facebook.net/en_US/sdk.js"
	  	script.id = 'facebook-jssdk'
	  	script.async = true

	  	return {
	  		restrict:'EA',
	  		//template: template,
	  		templateUrl: '/app_social_stream/directives/facebook.template.html',
	  		
	  		scope: {
	  			content: '=content',
	  			appId: '@',
	  			parameters: '=',
	  		},

	  		link: function (scope, element, attrs) {
	  			if (!facebook.initialized ()) {
	  				document.body.appendChild(script);
	  				var parameters = scope.parameters || {};

	  				angular.extend (parameters, {appId: scope.appId});
	  				facebook.init (parameters);
	  			}
	  		}
	  	}
	  }

})();