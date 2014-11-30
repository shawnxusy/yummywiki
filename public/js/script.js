$(document).on("mouseover", ".anchor-tooltip", function(event) {
	var href = $(this).attr("href");

	if (href.indexOf("org/wiki/") > -1) {
		var title = href.substring(href.search("wiki/") + 5);
		// Not files
		if (title.indexOf("File:") > -1) {
			return;
		}

		$(this).qtip({
			style: {
				classes: 'qtip-tipsy wiki-tooltip',
			},
			overwrite: false,
			content: {
				text: function(event, api) {
					$.ajax({
						url: "/summary/" + title
					})
					.then(function(data) {
						api.set("content.text", data.summary);
					});
					return "Loading...";
				}
			},
			show: {
				event: event.type,
				ready: true
			}
		}, event);
	}
});
