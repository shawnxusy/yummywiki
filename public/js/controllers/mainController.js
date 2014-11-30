var mainController = angular.module('mainController', []);

mainController.controller('homeController', ['$scope', '$routeParams', '$location', '$http',
	function($scope, $routeParams, $location, $http) {
		$scope.searchString = "";
		$scope.title = "Wiki Yummy";

		if ($routeParams.ambTitle) {
			$http.get('/search/' + $routeParams.ambTitle)
				.success(function(data) {
					$scope.ambQueries = data.ambQueries;
				})
		};

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

mainController.controller('yummyController', ['$scope', '$http', '$routeParams', '$sce', '$location',
	function($scope, $http, $routeParams, $sce, $location) {

		$scope.search = function() {
			$http.get('/search/' + $scope.searchString)
				.success(function(data) {

					// If the ajax search indicates the searched query is ambiguous
					// Give a list of ambiguous terms for user to choose
					if (data.flag == "multiple-result") {
						$location.path('/home/' + $scope.searchString);
					}
					// If the ajax search query returns a unique result
					// Lead user to that page immediately
					else if (data.flag == "one-result") {
						$location.path('/yummy/' + data.query);
					}
					// This line is for fun and should be deleted
					$scope.title = data.flag; 
					$scope.searchString = "";
				})
		};

		// Ask Node for the content of a Wikipedia query
		$http.get('/query/' + $routeParams.query)
			.success(function(data) {
				$scope.title = data.title;
				$scope.infobox = data.infobox;
				$scope.summary = data.summary;
				$scope.toc = data.toc;

				// Pre-process content
				for (item in data.content) {
					item.disabled = true;
				}
				data.content[0].active = true;
				data.content[0].disabled = false;

				// If some content is none, do not display even the header
				for (var i = 0; i < data.content.length; i++) {
					if (data.content[i].paragraphs.length < 1) {
						data.content.splice(i, 1);
					}
				}
				if (data.content[data.content.length - 1].paragraphs.length < 1) {
					data.content.splice(data.content.length - 1, 1);
				}
				
				$scope.content = data.content;

				if ($scope.infobox === "") {
				}

				$scope.showDetail = function(item) {
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


}])
