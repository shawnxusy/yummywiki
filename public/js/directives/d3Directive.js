var d3Directive = angular.module('d3Directive', ['d3']);

d3Directive.directive('knowledgeGraph', ['$window', '$timeout', 'd3Service', function($window, $timeout, d3Service) {
	return {
		restrict: 'EA',
		scope: {
			data: '=',
			onClick: '&'
		},
		link: function(scope, element, attrs) {
			d3Service.d3().then(function(d3) {
				var margin = parseInt(attrs.margin) || 10,
					barPadding = parseInt(attrs.barPadding) || 5,
					barHeight = parseInt(attrs.barHeight) || 20,
					width = element[0].clientWidth,
					height = element[0].clientHeight;


				// The returned d3 is the d3 drawing object
				var svg = d3.select(element[0])
							.append("svg")
							.attr('width', '100%')
							.attr('height', '100%')
							.style('float', 'left');

				// var infobox = d3.select(element[0])
				// 				.append("div")
				// 				.attr('width', '30%')
				// 				.attr('height', '100%')
				// 				.style('float', 'right')
				// 				.style('width', '30%');

				// Browser onresize event
				window.onresize = function() {
					scope.$apply();
				};


				// Watching resize event
				scope.$watch(function() {
					return angular.element($window)[0].innerWidth;
				}, function() {
					scope.render(scope.data);
				});

				// Watching for data change
				scope.$watch('data', function(newVals, oldVals) {
					return scope.render(newVals);
				}, true);


				scope.render = function(graph) {

					svg.selectAll(".node").remove();
					svg.selectAll(".link").remove();

					console.log("re-rendered");
					// Return if no data passed at all
					if (!graph) return;

					var color = d3.scale.category20();
					var chargeAmount = -150;
					var distanceAmount = 60;

					var force = d3.layout.force()
								.charge(chargeAmount)
								.linkDistance(distanceAmount)
								.size([width, height]);
					//*** Width and height??

					force.nodes(graph.nodes)
						.links(graph.links)
						.start();

					//Create all the line svgs but without locations yet
					var link = svg.selectAll(".link")
					    .data(graph.links)
					    .enter().append("line")
					    .attr("class", "link")
					    .style("stroke-width", function (d) {
						    return Math.sqrt(d.value);
						})
						.style("stroke", "rgba(100,100,100,0.4)")
						.style("opacity", "60%");

					//Do the same with the circles for the nodes - no 
					//Changed
					var node = svg.selectAll(".node")
					    .data(graph.nodes)
					    .enter().append("g")
					    .attr("class", "node")
					    .on("mouseover", nodeHovered)
					    .on("mouseout", nodeUnHovered)
					    .call(force.drag);

					node.append("circle")
					    .attr("r", 3)
					    .style("fill", function (d) {
					    return color(d.group);
					})

					node.append("text")
					      .attr("dx", 10)
					      .attr("dy", ".35em")
					      .text(function(d) { 
					      	return d.name;
					      })
					      .style("fill", "#fffffe")
					      .style("font-size", function(d) {
					      	return (14 - d.group * 4 + "px");
					      });

					//End changed
					function nodeHovered() {
						d3.select(this).select("circle")
							.transition()
							.duration(500)
							.style("fill", "#4be314")
							.ease("elastic");

						d3.select(this).select("text")
							.transition()
							.duration(500)
							.style("fill", "#2be3d6")
							.ease("elastic");

						// infobox.append("text")
						// 	.text(d3.select(this).text());

					};

					function nodeUnHovered() {
						// Clear everything
						// infobox.selectAll("*").remove();
						svg.selectAll("circle").style("fill", function(d) {
							return color(d.group);
						});
						svg.selectAll("text").style("fill", "#fffffe");
					}

					//Now we are giving the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using to update the attributes of the SVG elements
					force.on("tick", function () {
						node[0].x = width / 2;
						node[0].y = height / 2;
					    link.attr("x1", function (d) {
					        return d.source.x;
					    })
					        .attr("y1", function (d) {
					        return d.source.y;
					    })
					        .attr("x2", function (d) {
					        return d.target.x;
					    })
					        .attr("y2", function (d) {
					        return d.target.y;
					    });

					    //Changed
					    
					    svg.selectAll("circle").attr("cx", function (d) {
					        return d.x;
					    })
					        .attr("cy", function (d) {
					        return d.y;
					    });

					    svg.selectAll("text").attr("x", function (d) {
					        return d.x;
					    })
					        .attr("y", function (d) {
					        return d.y;
					    });
					    //End Changed
					});


				}
			});
		}
	};
}])