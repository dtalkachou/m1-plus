const observer = new MutationObserver(observerCallback)

observer.observe(document.getElementsByTagName('body')[0], {
    childList : true,
    subtree: true
})


function initCreditStatuses() {

    function onPlayerCreditStatusChanged(pl) {

        function getRoundsPostfix(roundsLeft) {
            return roundsLeft < 5 ? roundsLeft != 1 ? 'а' : '' : 'ов'
        }

        let creditDiv = document.querySelector(`#player_card_${pl.user_id} .table-body-players-card-body-credit`)

        if (pl.credit_payRound) {
            let payRoundLeft = pl.credit_payRound - Table.status.round
            creditDiv.innerHTML = `<b>возврат через ${payRoundLeft} раунд${getRoundsPostfix(payRoundLeft)}<b>`
        }
        else {
            let takeRoundsLeft = pl.credit_nextTakeRound - Table.status.round
            creditDiv.innerHTML = takeRoundsLeft > 0 ? `<i>доступен через ${takeRoundsLeft} раунд${getRoundsPostfix(takeRoundsLeft)}<i>` : 'доступен'
        }  
    }

    function onRoundChanged() {
        Table.status.players.forEach(pl => {
            if (pl.can_use_credit || pl.status == 0) {
                onPlayerCreditStatusChanged(pl)
            }
        })
    }

    function onPlayerStatusChanged(pl) {
        if (pl.can_use_credit && pl.status == -1) {
            let creditDiv = document.querySelector(`#player_card_${pl.user_id} .table-body-players-card-body-credit`)
            creditDiv.remove()
        }
    }

    const vm = new Vue({
        computed: {
            status: () => Table.status,
        },
    })
    vm.$watch('status.round', onRoundChanged)
    for (let i = 0; i < Table.status.players.length; i++) {
        vm.$watch(`status.players.${i}.credit_toPay`, () => {
            onPlayerCreditStatusChanged(Table.status.players[i])
        })
        vm.$watch(`status.players.${i}.status`, () => {
            onPlayerStatusChanged()
        })
    }
    
    (function() {
        Table.status.players.forEach(pl => {
            if (pl.can_use_credit && pl.status == 0) {
                onPlayerCreditStatusChanged(pl) 
            }
        })
    })();
}

function observerCallback(records) {

    function addStyleSheet(href) {
        let fileref = document.createElement('link')
        fileref.setAttribute('rel', 'stylesheet')
        fileref.setAttribute('type', 'text/css')
        fileref.setAttribute('href', href)
        document.getElementsByTagName("head")[0].appendChild(fileref)
    }

    function injetScript(func) {
        let script = document.createElement('script');
        script.appendChild(document.createTextNode('(' + func + ')()'));
        (document.body || document.head || document.documentElement).appendChild(script);
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

                    injetScript(initCreditStatuses)
                    data.data.forEach(setUserStats)
                })
        }
    })
}