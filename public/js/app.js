'use strict';

var myApp = angular.module('myApp', [
	'ngRoute',
	'ngSanitize',
	'mainController',
	'ui.bootstrap',
	'd3Directive',
]);

myApp.config(['$routeProvider', 
	function($routeProvider) {
		$routeProvider.
			when('/home', {
				templateUrl: 'views/home.html',
				controller: 'homeController'
			}).
			when('/home/:ambTitle', {
				templateUrl: 'views/home.html',
				controller: 'homeController'
			}).
			when('/yummy/:query', {
				templateUrl: 'views/yummy.html',
				controller: 'yummyController'
			}).
			otherwise({
				redirectTo: '/home'
			});
}]);
