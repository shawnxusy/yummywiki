var mainController = angular.module('mainController', []);

mainController.controller('homeController', ['$scope', '$routeParams', '$location', '$http',
	function($scope, $routeParams, $location, $http) {
		$scope.searchString = "";
		$scope.title = "Wiki Yummy";

		$scope.search = function() {
			$http.get('/search/' + $scope.searchString)
				.success(function(data) {
					$scope.searchString = "";

					// If the ajax search indicates the searched query is ambiguous
					// Give a list of ambiguous terms for user to choose
					if (data.flag == "multiple-result") {
						console.log(data.ambQueries);
						$scope.ambQueries = data.ambQueries;
					}
					// If the ajax search query returns a unique result
					// Lead user to that page immediately
					else if (data.flag == "one-result") {
						$location.path('/yummy/' + data.query);
					}
					// This line is for fun and should be deleted
					$scope.title = data.flag; 
				})
		};

		// Similar to above action. This gets called when user clicks a link.
		$scope.accuSearch = function(query) {
			$location.path('/yummy/' + query);
		}

}])

mainController.controller('yummyController', ['$scope', '$http', '$routeParams', '$sce',
	function($scope, $http, $routeParams, $sce) {


		// Ask Node for the content of a Wikipedia query
		$http.get('/query/' + $routeParams.query)
			.success(function(data) {
				$scope.title = data.title;
				$scope.infobox = data.infobox;
				$scope.summary = data.summary;
				$scope.toc = data.toc;

				for (item in data.content) {
					item.disabled = true;
				}
				data.content[0].active = true;
				data.content[0].disabled = false;
				
				$scope.content = data.content;

				// $scope.data = data.related;

				$scope.showDetail = function(item) {
					console.log("clicked");
					alert(item.name);
				};
			}
		)

		$http.get('/graph/' + $routeParams.query)
			.success(function(data) {
				console.log(data.related);
				$scope.data = data.related;
			})
		
		// Render HTML source code as actual html, rather than raw
		$scope.renderHtml = function(html_code) {
			return $sce.trustAsHtml(html_code);
		}

	

		// when landing on the page, get all todos and show them
		// $http.get('/api/todos')
		// 	.success(function(data) {
		// 		$scope.todos = data;
		// 		console.log(data);
		// 	})
		// 	.error(function(data) {
		// 		console.log('Error: ' + data);
		// 	});

		// // when submitting the add form, send the text to the node API
		// $scope.createTodo = function() {
		// 	$http.post('/api/todos', $scope.formData)
		// 		.success(function(data) {
		// 			$scope.formData = {}; // clear the form so our user is ready to enter another
		// 			$scope.todos = data;
		// 			console.log(data);
		// 		})
		// 		.error(function(data) {
		// 			console.log('Error: ' + data);
		// 		});
		// };

		// // delete a todo after checking it
		// $scope.deleteTodo = function(id) {
		// 	$http.delete('/api/todos/' + id)
		// 		.success(function(data) {
		// 			$scope.todos = data;
		// 			console.log(data);
		// 		})
		// 		.error(function(data) {
		// 			console.log('Error: ' + data);
		// 		});
		// };
}])
