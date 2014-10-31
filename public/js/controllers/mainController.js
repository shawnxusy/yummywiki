var mainController = angular.module('mainController', []);

mainController.controller('homeController', ['$scope', '$routeParams', '$location',
	function($scope, $routeParams, $location) {
		$scope.searchString = "";
		$scope.title = "Wiki Yummy";

		$scope.search = function() {
			$location.path('/search/' + $scope.searchString);
		};

}])

mainController.controller('yummyController', ['$scope', '$http', 
	function($scope, $http) {

		// when landing on the page, get all todos and show them
		$http.get('/api/todos')
			.success(function(data) {
				$scope.todos = data;
				console.log(data);
			})
			.error(function(data) {
				console.log('Error: ' + data);
			});

		// when submitting the add form, send the text to the node API
		$scope.createTodo = function() {
			$http.post('/api/todos', $scope.formData)
				.success(function(data) {
					$scope.formData = {}; // clear the form so our user is ready to enter another
					$scope.todos = data;
					console.log(data);
				})
				.error(function(data) {
					console.log('Error: ' + data);
				});
		};

		// delete a todo after checking it
		$scope.deleteTodo = function(id) {
			$http.delete('/api/todos/' + id)
				.success(function(data) {
					$scope.todos = data;
					console.log(data);
				})
				.error(function(data) {
					console.log('Error: ' + data);
				});
		};
}])
