const observer = new MutationObserver(observerCallback)

observer.observe(document.getElementsByTagName('body')[0], {
    childList : true,
    subtree: true
})


function createWebSocket() {
    const [gs_id, gs_game_id] = window.location.href.match(/#\/(\d+)\/(\d+)/).slice(1)
    const ws = new WebSocket(`wss://gs${gs_id}.monopoly-one.com/socket.io/?gs_game_id=${gs_game_id}&transport=websocket`)
    ws.onmessage = function(e) {

        function getRoundsPostfix(roundsLeft) {
            return roundsLeft < 5 ? roundsLeft != 1 ? 'а' : '' : 'ов'
        }

        try {
            const status = JSON.parse(e.data.match(/\[[\S\s]+\]/))[1].data.status
            status.players.forEach(p => {
                let playerCard = document.getElementById(`player_card_${p.user_id}`)
                let creditDiv = playerCard.getElementsByClassName('table-body-players-card-body-credit')[0]
                if (!p.can_use_credit) {
                    creditDiv.remove()
                }
                else {
                    if (p.credit_payRound) {
                        let payRoundLeft = p.credit_payRound - status.round
                        if (payRoundLeft > 0)
                            creditDiv.innerHTML = `возврат через ${payRoundLeft} раунд${getRoundsPostfix(payRoundLeft)}`
                        return
                    }

                    let takeRoundsLeft = p.credit_nextTakeRound - status.round
                    creditDiv.innerHTML = takeRoundsLeft > 0 ? `доступен через ${takeRoundsLeft} раунд${getRoundsPostfix(takeRoundsLeft)}` : 'доступен'
                }
            })
        }
        catch(err) {
            // Other messages
        }
    }
}


function observerCallback(records) {
    function addStyleSheet(href) {
        let fileref = document.createElement('link')
        fileref.setAttribute('rel', 'stylesheet')
        fileref.setAttribute('type', 'text/css')
        fileref.setAttribute('href', href)
        document.getElementsByTagName("head")[0].appendChild(fileref)
    }

    function setUserStats(user) {
        let playerCard = document.getElementById(`player_card_${user.user_id}`)
        if (user.hasOwnProperty('rank')) {
            playerCard.querySelector('.table-body-players-card-body-stats-rank').style.backgroundImage = `url("${user.rank.img}")`
        }
        let winRate = user.games_wins / user.games * 100 || 0;
        playerCard.querySelector('.table-body-players-card-body-stats-games').innerHTML = `${user.games_wins} / ${user.games}<span>(${Math.round(winRate)}%)</span>`
    }

    const re = /^player_card_(\d+)$/;
    const user_ids = [];

    records.forEach((arg) => {
        if (arg.target.classList.contains('table-body-players')) {
            // Collect user ids
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
                .then(response => {
                    return response.json();
                })
                .then(data => { 
                    addStyleSheet('https://dtalkachou.github.io/m1-plus/css/rewrited-table-new.css')

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

                        // let cardBodyMoneyDiv = document.createElement('div')
                        // cardBodyMoneyDiv.className = 'table-body-players-card-body-bankroll'
                        // cardBodyConditionDiv.appendChild(cardBodyMoneyDiv)

                        let cardBodyCreditDiv = document.createElement('div')
                        cardBodyCreditDiv.className = 'table-body-players-card-body-credit'
                        cardBodyConditionDiv.appendChild(cardBodyCreditDiv)
                    }

                    createWebSocket()
                    data.data.forEach(setUserStats)
                })
        }
    })
}