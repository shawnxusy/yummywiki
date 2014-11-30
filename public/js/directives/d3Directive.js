var d3Directive = angular.module('d3Directive', ['d3']);

d3Directive.directive('knowledgeGraph', ['$window', '$timeout', 'd3Service', '$http', function($window, $timeout, d3Service, $http) {
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
							.attr('class', 'graph');

				var infobox = d3.select(element[0])
								.append("div")
								.attr('class', 'illustration');

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

					if (!graph) {
						svg.selectAll("image").remove();
						svg.append("image")
							.attr("xlink:href", "/img/graph-holder.png")
							.attr("width", 300)
							.attr("height", 300);
						return;
					}

					svg.selectAll("image").remove();
					svg.selectAll(".node").remove();
					svg.selectAll(".link").remove();

					console.log("re-rendered");

					// var color = d3.scale.category20();
					var color = d3.scale.ordinal()
									.domain([0,1,2,3])
									.range(["#3a3042", "#a3c95b", "#90bede", "#729b79"]);

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
						.style("stroke", "rgba(180,180,180,0.3)")
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
					      .attr("wikihref", function(d) {
					      	return d.wikihref;
					      })
					      .style("fill", "#635255")
					      .style("font-size", function(d) {
						      return (14 - d.group * 3 + "px");
					      });

					//End changed
					function nodeHovered() {
						infobox.selectAll("text").remove();
						infobox.selectAll("div").remove();
						// Clear everything
						svg.selectAll("circle").style("fill", function(d) {
							return color(d.group);
						})
							.style("r", 3);
						svg.selectAll("text").style("fill", "#635255")
							.style("font-size", function(d) {
						      	return (14 - d.group * 3 + "px");
				        });

						d3.select(this).select("circle")
							.transition()
							.duration(500)
							.style("fill", "#822e01")
							.attr("r", 5)
							.ease("elastic");

						d3.select(this).select("text")
							.transition()
							.duration(500)
							.style("fill", "#822e01")
							.style("font-size", "14px")
							.ease("elastic");

						infobox.append("text")
							.text(d3.select(this).text())
							.style("font-weight", "600");

						// Ajax call
						d3.json('/summary/' + d3.select(this).select("text").attr("wikihref"), function(error, json) {
							if (error) {
								console.log(error);
							}
							var data = json;
							infobox.append("div")
									.text(data.summary);
						})
							

					};

					function nodeUnHovered() {
						// Clear everything
						svg.selectAll("circle").style("fill", function(d) {
							return color(d.group);
						})
							.style("r", 3);
						svg.selectAll("text").style("fill", "#635255")
							.style("font-size", function(d) {
						      	return (14 - d.group * 3 + "px");
					      });
					}

					//Now we are giving the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using to update the attributes of the SVG elements
					force.on("tick", function () {
						var nodes = force.nodes();
						nodes[0].x = width / 2;
						nodes[0].y = height * 0.35;
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
}]);