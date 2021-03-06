var mutation = false
const observer = new MutationObserver(records=> {

    function injetScript(func, execute=true) {
        let script = document.createElement('script');
        script.innerHTML = '<!-- This code is injected by M1 Plus extension. -->\n'
        script.appendChild(document.createTextNode(execute ? '(' + func + ')()' : func));
        (document.body || document.head || document.documentElement).appendChild(script);
    }

    records.forEach(arg => {
        if (arg.target.id && arg.target.id === 'styles-dyn-css') {
            // Scripts on page have two mutation with #styles-dyn-css.
            // First mutation before muttation with .table-body-players, second after.
            if (!mutation) {
                mutation = true;
                return
            }

            observer.disconnect();

            injetScript(getBankrollPlayerCardValue, false)
            injetScript(initPlayersStats)
            initBankroll()
            injetScript(initCreditStatuses)
        }
    })
})

function getBankrollPlayerCardValue(bankrollValue) {
    bankrollValue = parseInt(bankrollValue.replace(/,|\./, '')) / 1000
    if (bankrollValue < 10) {
        return bankrollValue.toLocaleString(undefined, {
            maximumFractionDigits: 1
        })
    }
    return parseInt(bankrollValue)
}

function initBankroll() {
    let contentPlayers = document.querySelector('.TableHelper-content-players')
    const observer = new MutationObserver(records => {
        records.forEach(arg => {
            let playerRow = arg.target.parentNode.closest('.TableHelper-content-players-row')
            if (playerRow && arg.target.parentNode.classList.contains('_bankroll')) {
                playerRow.querySelector('._dot').classList.forEach(cl => {
                    if (cl.match(/_index_[0-4]/)) {
                        let cardBodyBankrollDiv = document.querySelector(`[mnpl-order="${cl.charAt(7)}"] .table-body-players-card-body-bankroll`)
                        cardBodyBankrollDiv.innerHTML = getBankrollPlayerCardValue(arg.target.data)
                        return
                    }
                })
            }
        })
    })

    observer.observe(contentPlayers, {
        subtree: true,
        characterData: true
    })
}

function initPlayersStats() {
    document.getElementsByClassName('table-body-players')[0].setAttribute('m1-plus', true)

    for (let player of Table.status.players) {
        let playerCard = document.querySelector(`#player_card_${player.user_id}`)
        let playersCardBody = playerCard.getElementsByClassName('table-body-players-card-body')[0]

        let cardBodyInfoRowDiv = document.createElement('div')
        cardBodyInfoRowDiv.className = 'table-body-players-card-body-info-row'
        cardBodyInfoRowDiv.appendChild(playersCardBody.getElementsByClassName('table-body-players-card-body-avatar')[0])
        cardBodyInfoRowDiv.appendChild(playersCardBody.getElementsByClassName('table-body-players-card-body-timer')[0])
        playersCardBody.appendChild(cardBodyInfoRowDiv)

        let cardBodyConditionRowDiv = document.createElement('div')
        cardBodyConditionRowDiv.className = 'table-body-players-card-body-condition-row'
        let cardBodyBankrollDiv = document.createElement('div')
        cardBodyBankrollDiv.className = 'table-body-players-card-body-bankroll'
        let mnplOrder = playerCard.getAttribute('mnpl-order')
        const selector = '.TableHelper-content-players-row'
        let bankrollDiv = document.querySelector(`${selector} ._index_${mnplOrder}`).closest(selector).children[1]
        bankrollDiv.className = '_bankroll'
        cardBodyBankrollDiv.innerHTML =  getBankrollPlayerCardValue(bankrollDiv.textContent)
        if (player.status) {  
            cardBodyBankrollDiv.remove()
        }
        else {
            cardBodyConditionRowDiv.appendChild(cardBodyBankrollDiv)
        }
        cardBodyConditionRowDiv.appendChild(playersCardBody.getElementsByClassName('table-body-players-card-body-money')[0])
        let cardBodyInfoDiv = document.createElement('div')
        cardBodyInfoDiv.className = 'table-body-players-card-body-info'
        cardBodyInfoDiv.appendChild(playersCardBody.getElementsByClassName('table-body-players-card-body-nick')[0])
        cardBodyInfoDiv.appendChild(cardBodyConditionRowDiv)
        cardBodyInfoRowDiv.appendChild(cardBodyInfoDiv)


        let cardBodyCreditDiv = document.createElement('div')
        cardBodyCreditDiv.className = 'table-body-players-card-body-credit'
        if (!player.can_use_credit || player.status) {
            cardBodyCreditDiv.remove()
            playerCard.classList.add('no-credit')
        }
        else {
            playersCardBody.appendChild(cardBodyCreditDiv)
        }
    }
}

function initCreditStatuses() {

    function onPlayerCreditStatusChanged(pl) {

        function getRoundsPostfix(roundsLeft) {
            return roundsLeft < 5 && roundsLeft ? roundsLeft != 1 ? 'а' : '' : 'ов'
        }

        let creditDiv = document.querySelector(`#player_card_${pl.user_id} .table-body-players-card-body-credit`)

        if (pl.credit_payRound) {
            if (creditDiv.classList.contains('_take')) {
                creditDiv.classList.remove('_take')
            }
            if (!creditDiv.classList.contains('_pay')) {
                creditDiv.classList.add('_pay')
            }
            let payRoundLeft = pl.credit_payRound - Table.status.round
            creditDiv.innerHTML = `возврат ${payRoundLeft} раунд${getRoundsPostfix(payRoundLeft)}`
        }
        else {
            if (creditDiv.classList.contains('_pay')) {
                creditDiv.classList.remove('_pay')
            }
            if (!creditDiv.classList.contains('_take')) {
                creditDiv.classList.add('_take')
            }
            let takeRoundsLeft = pl.credit_nextTakeRound - Table.status.round
            creditDiv.innerHTML = takeRoundsLeft > 0 ? `доступен ${takeRoundsLeft} раунд${getRoundsPostfix(takeRoundsLeft)}` : 'доступен'
        }  
    }

    function onPlayerStatusChanged(pl) {
        if (pl.status == -1) {
            let playerCard = document.querySelector(`#player_card_${pl.user_id}`)
            playerCard.querySelector(`.table-body-players-card-body-bankroll`).remove()
            if (pl.can_use_credit) {
                playerCard.querySelector(`.table-body-players-card-body-credit`).remove()
                playerCard.classList.add('no-credit')
            }
        }
    }

    function onRoundChanged() {
        Table.status.players.forEach(pl => {
            if (pl.can_use_credit && pl.status == 0) {
                onPlayerCreditStatusChanged(pl)
            }
        })
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

observer.observe(document.getElementsByTagName('body')[0], {
    childList : true,
    subtree: true
})