// app/routes.js
// load the todo model
	var Todo = require('./components/home/todo');

// For parsing Wiki
	var cheerio = require('cheerio');
	var request = require('request');

	module.exports = function(app) {

	// api ---------------------------------------------------------------------
	// get all todos
	app.get('/api/todos', function(req, res) {

		// use mongoose to get all todos in the database
		Todo.find(function(err, todos) {

			// if there is an error retrieving, send the error. nothing after res.send(err) will execute
			if (err)
				res.send(err)

			res.json(todos); // return all todos in JSON format
		});
	});

	// create todo and send back all todos after creation
	app.post('/api/todos', function(req, res) {

		// create a todo, information comes from AJAX request from Angular
		Todo.create({
			text : req.body.text,
			done : false
		}, function(err, todo) {
			if (err)
				res.send(err);

			// get and return all the todos after you create another
			Todo.find(function(err, todos) {
				if (err)
					res.send(err)
				res.json(todos);
			});
		});

	});

	// delete a todo
	app.delete('/api/todos/:todo_id', function(req, res) {
		Todo.remove({
			_id : req.params.todo_id
		}, function(err, todo) {
			if (err)
				res.send(err);

			// get and return all the todos after you create another
			Todo.find(function(err, todos) {
				if (err)
					res.send(err)
				res.json(todos);
			});
		});
	});

	// Search Wiki for a term
	// If more than one potential result returns, feed these back
	// If only one result returns, indicate that our app could proceed
	app.get('/search/:text', function(req, res) {

		var text = req.params.text; // Might need some parsing?

		var url = "http://en.wikipedia.org/w/index.php?action=render&title=" + text;

		request(url, function(error, response, html) {
			if (!error) {
				var $ = cheerio.load(html);
				
				var flag;
				var data = {flag: "", ambQueries: [], query: "", results: {}};

				// Check if there is result
				if ( $(".noarticletext").length != 0 ) {
					flag = "no-result";
				}
				// Check if there are ambiguous results, return these results with links
				else if ( $("#disambigbox").length != 0 ) {
					flag = "multiple-result";

					$("li").each(function() {
						var liContent = {};
						var wikiUrl = $(this).find("a").attr("href");
						liContent.url = wikiUrl.substring(wikiUrl.search("/wiki") + 6); // Get the actual query
						liContent.title = $(this).text();

						data.ambQueries.push(liContent);
					})
				}
				// If there is only one accurate result
				else {
					flag = "one-result";

				}
				data.flag = flag;
				data.query = text;

				res.json(data);
			}
		});

	});

	app.get('/query/:text', function(req, res) {
		var text = req.params.text;

		// Main processing goes on here
		// Query the raw Wikipedia and gives back results
		var url = "http://en.wikipedia.org/w/index.php?action=render&title=" + text;

		request(url, function(error, response, html) {
			if (!error) {

				// Since html returned does not contain "body", add "body"
				html = "<body>" + html + "</body>";
				var $ = cheerio.load(html);

				var data = {title: "", summary: [], toc: [], infobox: "", content: []};

				// Add all body's children into an array for processing
				var blocks = [];

				/*
					The way to capture data is using a bunch of flags.
					For instance, when we detect that a summary paragraph is being processed
					Set the summary_flag to true, and get the paragraphs in to summary array
				 */
				var flags = {
					"summary_flag": true,
					"toc_flag": false,
					"main_content_flag": false,
					"related_flag": false,
				};

				var infoboxDone = false;

				// Helper function to set a called flag to be true and rest flags to be false
				function setFlag(flag_name) {
					flags[flag_name] = true;
					for (var f in flags) {
						if (f != flag_name) {
							flags[f] = false;
						};
					};
				};

				$("body").children().each(function() {
					// Some paragraph are empty, skip them
					if (!$(this).text()) {
						return true;
					};

					// Infobox is usually at the very beginning
					if ( $(this).attr("class") && ($(this)[0].name == "table") ) {
						// There could be multiple infoboxes, only pick the first one
						if ( ($(this).attr("class").indexOf("infobox") > -1) && (!infoboxDone) ) {
							data.infobox = $(this).html();
							infoboxDone = true;
						}
					};
					// Unfortunately some of the articles wrap infobox in a div...
					if ($(this).children().first().attr("class")) {
						if ( ($(this).children().first().attr("class").indexOf("infobox") > -1) && (!infoboxDone) ) {
							data.infobox = $(this).children().first().html();
							infoboxDone = true;
						}
					};

					// Processing paragraphs
					if ($(this)[0].name == 'p') {
						// If it's a summary paragraph
						if (flags["summary_flag"]) {
							data.summary.push($(this).html());
						};

						// Deal with other paragraphs
						if (flags["main_content_flag"]) {
							// Should also define other methods to deal with "See also" and "references"

							// Find the latest section in data.content and pour data there
							data.content[data.content.length - 1].paragraphs.push($(this).html());
						};
					};

					// Processing headers
					if ($(this)[0].name == 'h2') {
						// Set the flag to main content to receive main paragraphs
						if ($(this).children().first().text() == 'See also') {
							setFlag("related_flag");
						}
						else {
							setFlag("main_content_flag");

							// Add a section in content
							var newSection = {};
							newSection.title = $(this).text();
							newSection.paragraphs = [];

							data.content.push(newSection);
						}
					}

					// Processing table of content (toc)
					// Could also get the "href" for each TOC link if necessary.
					if ($(this).attr("id") == "toc") {
						// First turn off the summary flag and open toc_flag
						setFlag("toc_flag");

						$(this).children("ul").children().each(function() {
							var toc_item = {};
							toc_item.content = $(this).find(".toctext").first().text();
							data.toc.push( toc_item );
						})
					}

					// Processing see also
					// Output would be JSON format
					// if (flags["related_flag"] && ($(this)[0].name != "h2")) {
					// 	// As soon as there is a ul, go for it
					// 	var list = [];
					// 	if ($(this)[0].name == "ul") {
					// 		list = $(this).children();
					// 	}
					// 	else if ($(this).has("ul").length > 0) {
					// 		list = $(this).find("ul").children();
					// 	}

					// 	if (list.length) {
					// 		// Do the processing
					// 		data.related["nodes"] = [];
					// 		data.related["links"] = [];

					// 		// If we are certain there is some topics related to this one
					// 		// Start with the first circle
					// 		var original = {"name": text, "group": 0};
					// 		data.related["nodes"].push(original);

					// 		var depth = 3; // This defines how far we should go		
							
					// 		var currentGroup = 0;

					// 		for (var i = 0; i < list.length; i++) {
					// 			var newNode = {"name": $(list[i]).text(), "group": 1};
					// 			var newLink = {"source": i+1, "target": 0, "value": 1};
					// 			data.related["nodes"].push(newNode);
					// 			data.related["links"].push(newLink);

					// 			var secondLayer = processNode($(list[i]).find("a").attr("href"));
					// 			console.log(secondLayer);

					// 		}

					// 	}
					// 	else {
					// 		// There is nothing related to this topic
					// 	}
					// }
					
				});
				
				// Is it the summary paragraph?
				data.title = text;
				

				res.json(data);
			}
		})

		
	});

	
	app.get('/graph/:text', function(req, res) {
		var text = req.params.text;
		var firstLevelSectionsURL = "http://en.wikipedia.org/w/api.php?format=json&action=parse&page=" + text;

		var data = {related: {}};
		data.related["nodes"] = [];
		data.related["links"] = [];

		var currentNode = 0;

		var original = {"name": text, "group": 0};
		data.related["nodes"].push(original);
		currentNode = currentNode + 1;

		function getFirstLevelSections(url, callback) {
			request(url, function(error, response, json) {
			if (!error) {
				var sections = JSON.parse(json).parse.sections;
				for (var i = 0; i < sections.length; i++) {
					if (sections[i].anchor === "See_also") {
						var firstLevelContentURL = "http://en.wikipedia.org/w/api.php?format=json&action=parse&page=" + text + "&prop=text&section=" + sections[i].index;
						getFirstLevelContent(firstLevelContentURL, callback);
					}
				}
			}
			});
		}

		function getFirstLevelContent(url, callback) {
			request(url, function(error, response, json) {
			if (!error) {
				var content = JSON.parse(json);
				var $ = cheerio.load(content.parse.text["*"]);
				var listLength = $("li").length;

				$("li").each(function() {
					// Push each title to result and form links
					var newNode = {"name": $(this).text(), "group": 1};
					var newLink = {"source": currentNode, "target": 0, "value": 2};
					data.related["nodes"].push(newNode);
					data.related["links"].push(newLink);

					var href = $(this).find("a").attr("href");
					var secondLevelSectionsURL =  "http://en.wikipedia.org/w/api.php?format=json&action=parse&page=" + href.substring(href.search("wiki/") + 5) + "&prop=sections";

					listLength = listLength - 1;
					if (listLength > 0) {
						getSecondLevelSections(secondLevelSectionsURL, currentNode, false, callback);
					}
					else {
						getSecondLevelSections(secondLevelSectionsURL, currentNode, true, callback);

					}

					currentNode = currentNode + 1;
				});

			}
			});

		}

		function getSecondLevelSections(url, current, last, callback) {
			request(url, function(error, response, json) {
				if (!error) {
					var sections = JSON.parse(json).parse.sections;
					for (var i = 0; i < sections.length; i++) {
						if (sections[i].anchor === "See_also") {
							var secondLevelContentURL = url.substring(0, url.search("&prop")) + "&prop=text&section=" + sections[i].index;
							getSecondLevelContent(secondLevelContentURL, current, last, callback);
							return;
						}
					};
					// If this is the last second level section yet no "related" is found, call back
					getSecondLevelContent(null, current, last, callback);
				}
			})
		}

		function getSecondLevelContent(url, target, last, callback) {
			if ((last === true) && (!url)) {
				setTimeout(function() {
					callback();
				}, 2000);
				return;
			}

			request(url, function(error, response, json) {
				if (!error) {
					console.log("at second level");
					var content = JSON.parse(json);
					var $ = cheerio.load(content.parse.text["*"]);
					var listLength = $("li").length;

					$("li").each(function() {
						// Push each title to result and form links
						var newNode = {"name": $(this).text(), "group": 2};
						var newLink = {"source": currentNode, "target": target, "value": 1};
						data.related["nodes"].push(newNode);
						data.related["links"].push(newLink);

						currentNode = currentNode + 1;
					});

					if (last === true) {
						console.log("callback 2")
						callback();
					}
				}
			});
		}
		
		getFirstLevelSections(firstLevelSectionsURL, function(){
			// console.log(data);
			res.json(data);
		});



	});
	

	// application -------------------------------------------------------------
	app.get('*', function(req, res) {
		res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
	});

};