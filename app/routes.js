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
		console.log(url);

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
					"see_also_flag": false
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
						// console.log($(this).children().first().attr("class"));
						if ( $(this).children().first().attr("class").indexOf("infobox") > -1 ) {
							console.log("Found a match");
							data.infobox = $(this).children().first().html();
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
						setFlag("main_content_flag");

						// Add a section in content
						var newSection = {};
						newSection.title = $(this).text();
						newSection.paragraphs = [];

						data.content.push(newSection);
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
				});
				
				// Is it the summary paragraph?
				data.title = text;
				

				res.json(data);
			}
		})

		
	});

	// application -------------------------------------------------------------
	app.get('*', function(req, res) {
		res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
	});

};