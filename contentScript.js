const user_ids = [];

const node = document.getElementsByTagName('body')[0];

const observer = new MutationObserver(records => {
	var re = /^player_card_(\d+)$/;
	records.forEach(function(arg) {
		arg.addedNodes.forEach(function(arg) {
			var user_id = arg.id && re.test(arg.id) && arg.id.match(re)[1];
			if (user_id) {
				user_ids.push(user_id);
			}
		});
	});
});

observer.observe(node, {
	childList : true,
	subtree: true
});