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

				var data = {title: "", summary: [], infobox: ""};

				// Add all body's children into an array for processing
				var blocks = [];

				$("body").children().each(function() {
					// Is it a infobox?
					if ($(this).attr("class")) {
						if ($(this).attr("class").indexOf("infobox") > -1) {
							data.infobox = $(this).html();
							// Deal with infobox here
						}
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