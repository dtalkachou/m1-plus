var mutation = false
const observer = new MutationObserver(observerCallback)

observer.observe(document.getElementsByTagName('body')[0], {
    childList : true,
    subtree: true
})


function setUsersStats() {
    document.getElementsByClassName('table-body-players')[0].setAttribute('m1-plus', true)

    for (let player of Table.status.players) {
        let playersCardBody = document.querySelector(`#player_card_${player.user_id} .table-body-players-card-body`)

        let cardBodyInfoRowDiv = document.createElement('div')
        cardBodyInfoRowDiv.className = 'table-body-players-card-body-info-row'
        cardBodyInfoRowDiv.appendChild(playersCardBody.getElementsByClassName('table-body-players-card-body-avatar')[0])
        cardBodyInfoRowDiv.appendChild(playersCardBody.getElementsByClassName('table-body-players-card-body-timer')[0])
        playersCardBody.appendChild(cardBodyInfoRowDiv)

        let cardBodyInfoDiv = document.createElement('div')
        cardBodyInfoDiv.className = 'table-body-players-card-body-info'
        cardBodyInfoDiv.appendChild(playersCardBody.getElementsByClassName('table-body-players-card-body-nick')[0])
        cardBodyInfoDiv.appendChild(playersCardBody.getElementsByClassName('table-body-players-card-body-money')[0])
        cardBodyInfoRowDiv.appendChild(cardBodyInfoDiv)


        let cardBodyCreditDiv = document.createElement('div')
        cardBodyCreditDiv.className = 'table-body-players-card-body-credit'
        cardBodyCreditDiv.hidden = !player.can_use_credit || player.status
        playersCardBody.appendChild(cardBodyCreditDiv)
    }
}

function initCreditStatuses() {

    function onPlayerCreditStatusChanged(pl) {

        function getRoundsPostfix(roundsLeft) {
            return roundsLeft < 5 ? roundsLeft != 1 ? 'а' : '' : 'ов'
        }

        let creditDiv = document.querySelector(`#player_card_${pl.user_id} .table-body-players-card-body-credit`)

        if (pl.credit_payRound) {
            let payRoundLeft = pl.credit_payRound - Table.status.round
            creditDiv.innerHTML = `<div class="_pay"></div>${payRoundLeft} раунд${getRoundsPostfix(payRoundLeft)}`
        }
        else {
            let takeRoundsLeft = pl.credit_nextTakeRound - Table.status.round
            creditDiv.innerHTML = `<div class="_take"></div>${takeRoundsLeft > 0 ? `${takeRoundsLeft} раунд${getRoundsPostfix(takeRoundsLeft)}` : 'доступен'}`
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
            onPlayerStatusChanged(Table.status.players[i])
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

    function injetScript(func) {
        let script = document.createElement('script');
        script.innerHTML = '<!-- This code is injected by M1 Plus extension. -->\n'
        script.appendChild(document.createTextNode('(' + func + ')()'));
        (document.body || document.head || document.documentElement).appendChild(script);
    }

    const re = /^player_card_(\d+)$/;
    const user_ids = [];

    records.forEach((arg) => {
        if (arg.target.id && arg.target.id === 'styles-dyn-css') {
            // Scripts on page have two mutation with #styles-dyn-css.
            // First mutation before muttation with .table-body-players, second after.
            if (!mutation) {
                mutation = true;
                return
            }

            observer.disconnect();
            
            injetScript(setUsersStats)
            injetScript(initCreditStatuses)
        }
    })
}