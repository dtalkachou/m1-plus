const user_ids = [];

const observer = new MutationObserver(records => {
	let re = /^player_card_(\d+)$/;
	records.forEach(function(arg) {
		if (arg.target.classList.contains('table-body-players')) {
			let addedNode = arg.addedNodes[0];
			var user_id = addedNode.id && re.test(addedNode.id) && addedNode.id.match(re)[1];
			if (user_id) {
				user_ids.push(user_id);
			}
		}
		else if (arg.target.id && arg.target.id === 'styles-dyn-css' && user_ids.length) {
			// Scripts on page have two mutation with #styles-dyn-css.
			// First mutation before muttation with .table-body-players, second after
			observer.disconnect();

			var xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					console.log(this.responseText)
					// document.getElementById("demo").innerHTML = this.responseText;
				}
			};
			xhttp.open('GET', 'https://monopoly-one.com/api/users.get?user_ids=' + user_ids.join(','), true);
			xhttp.send();
		}
	});
});

observer.observe(document.getElementsByTagName('body')[0], {
	childList : true,
	subtree: true
});