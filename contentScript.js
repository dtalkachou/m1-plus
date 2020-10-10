const observer = new MutationObserver(records => {
	const re = /^player_card_(\d+)$/;

	const user_ids = [];
	records.forEach((arg) => {
		if (arg.target.classList.contains('table-body-players')) {
			let addedNode = arg.addedNodes[0]
			let user_id = addedNode.id && re.test(addedNode.id) && addedNode.id.match(re)[1]
			if (user_id) {
				user_ids.push(user_id)
			}
		}
		else if (arg.target.id && arg.target.id === 'styles-dyn-css' && user_ids.length) {
			// Scripts on page have two mutation with #styles-dyn-css.
			// First mutation before muttation with .table-body-players, second after
			observer.disconnect();

			fetch('https://monopoly-one.com/api/users.get?user_ids=' + user_ids.join(','))
				.then((response) => {
					return response.json();
				})
				.then((data) => {
					let fileref = document.createElement('link')
					fileref.setAttribute('rel', 'stylesheet')
					fileref.setAttribute('type', 'text/css')
					fileref.setAttribute('href', 'https://dtalkachou.github.io/m1-plus/css/rewrited-table-new.css')
					document.getElementsByTagName("head")[0].appendChild(fileref)
					
					let playersCardBodys = document.getElementsByClassName('table-body-players-card-body')
					for (let item of playersCardBodys) {
						let cardBodyInfoDiv = document.createElement('div')
						cardBodyInfoDiv.className = 'table-body-players-card-body-info'
						cardBodyInfoDiv.appendChild(item.firstChild)
						item.insertBefore(cardBodyInfoDiv, item.firstChild)

						let cardBodyStatsDiv = document.createElement('div')
						cardBodyStatsDiv.className = 'table-body-players-card-body-stats'
						cardBodyInfoDiv.appendChild(cardBodyStatsDiv)

						let cardBodyStatsRankDiv = document.createElement('div')
						cardBodyStatsRankDiv.className = 'table-body-players-card-body-stats-rank'
						cardBodyStatsDiv.appendChild(cardBodyStatsRankDiv)

						let cardBodyStatsGamesDiv = document.createElement('div')
						cardBodyStatsGamesDiv.className = 'table-body-players-card-body-stats-games'
						cardBodyStatsDiv.appendChild(cardBodyStatsGamesDiv)

						let cardBodyConditionDiv = document.createElement('div')
						cardBodyConditionDiv.className = 'table-body-players-card-body-condition'
						cardBodyConditionDiv.appendChild(item.children[2])
						item.insertBefore(cardBodyConditionDiv, item.lastChild)
					}

					data.data.forEach((user) => {
						let playerCard = document.getElementById('player_card_' + user.user_id)
						if (user.hasOwnProperty('rank')) {
							playerCard.querySelector('.table-body-players-card-body-stats-rank').style.backgroundImage = `url("${user.rank.img}")`
						}
						let winRate = user.games_wins / user.games * 100 || 0;
						playerCard.querySelector('.table-body-players-card-body-stats-games').innerHTML = `${user.games_wins} / ${user.games}<span>(${Math.round(winRate)}%)</span>`
					})
				})
		}
	})
})

observer.observe(document.getElementsByTagName('body')[0], {
	childList : true,
	subtree: true
})


const results = window.location.href.match(/#\/(\d+)\/(\d+)/)
const gs_id = results[1]
const gs_game_id = results[2]
const ws = new WebSocket(`wss://gs${gs_id}.monopoly-one.com/socket.io/?gs_game_id=${gs_game_id}&transport=websocket`)
ws.onmessage = function(e) {
	try {
		const palyers = JSON.parse(e.data.match(/\[[\S\s]+\]/))[1].data.status.players
		console.log(players)

	}
	catch(err) {
		// Other messages
	}
}