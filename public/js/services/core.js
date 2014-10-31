'use strict';

var myApp = angular.module('myApp', [
	'ngRoute',
	'mainController'
]);

myApp.config(['$routeProvider', 
	function($routeProvider) {
		$routeProvider.
			when('/home', {
				templateUrl: 'views/home.html',
				controller: 'homeController'
			}).
			when('/search/:searchString', {
				templateUrl: 'views/yummy.html',
				controller: 'yummyController'
			}).
			otherwise({
				redirectTo: '/home'
			});
}]);