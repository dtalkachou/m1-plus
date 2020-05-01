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
					var responseData = JSON.parse(this.responseText).data;

					var fileref = document.createElement('link')
					fileref.setAttribute('rel', 'stylesheet')
					fileref.setAttribute('type', 'text/css')
					fileref.setAttribute('href', 'https://dtalkachou.github.io/m1-plus/css/rewrited-table-new.css')
					document.getElementsByTagName("head")[0].appendChild(fileref)
					
					responseData.forEach(function(el) {
						// let winRate = el.games_wins / el.games * 100 || 0;

						let cardBodyInfoDiv = document.createElement('div')
						cardBodyInfoDiv.className = 'table-body-players-card-body-info'
						let cardBodyDiv = document.querySelector('.table-body-players-card-body')
						cardBodyDiv.insertBefore(cardBodyInfoDiv, cardBodyDiv.firstChild)
						document.getElementsByTagName("head")[0].appendChild(fileref)

						cardBodyInfoDiv.appendChild(document.querySelector('.table-body-players-card-body-avatar'))
						// let playerCardStatsDiv = document.createElement('div');
						// playerCardStatsDiv.className = ''

						// str += el.nick.concat(" - ", el.hasOwnProperty('rank') ? el.rank.title : 'Без звания', ' - ( ', el.games_wins, ' / ', el.games, ' = ', Math.round(winRate), '% )\n');
					})
					// alert(str);
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