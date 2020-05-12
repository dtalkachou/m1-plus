const observerConfig = {
	childList : true,
	subtree: true
}

const notForSaleText = 'не для продажи'
const noPriceText = 'нет цены'
const inventoryThings = getInventoryThings()

const observer = new MutationObserver(records => {
	records.forEach(async rec => {
		if (rec.target.classList.contains('inventory-items')) {
			rec.addedNodes.forEach(node => {
				if ('classList' in node)
					if (node.classList.contains('emptylistmessage')) {
						observer.disconnect()
						observer.observe(rec.target, observerConfig)
					}
					else if (node.classList.contains('inventory-items-one')) {
						let priceDiv = document.createElement('div')
						priceDiv.className = 'thing-price'

						priceDiv.innerHTML = '<div class="content-ph"></div>'

						let thingContentDiv = document.createElement('div')
						thingContentDiv.className = 'thing-contnent'
						thingContentDiv.appendChild(node.firstChild)
						thingContentDiv.appendChild(priceDiv)
						node.insertBefore(thingContentDiv, node.firstChild)

						if (+node.getAttribute('mnpl-inventory-thingid') > 0) {
							inventoryThings.
								then(things => {
									let thingData = things.find(thing => thing.thing_id == node.getAttribute('mnpl-inventory-thingid'))
									priceDiv.innerHTML = `<div>${thingData.price ? thingData.price : notForSaleText}</div>`
									if (typeof(thingData.price) === 'number')
										priceDiv.firstChild.innerHTML += ' р.'
									if (thingData.price === notForSaleText)
										priceDiv.firstChild.className = 'thing-price-not-for-sale'
									else if (thingData.price === noPriceText)
										priceDiv.firstChild.className = 'thing-price-no-price'

									if (thingData.can_sell > 0)
										priceDiv.firstChild.className += 'thing-price-banned'
								})
						}
						else
							priceDiv.innerHTML = `<div class='thing-price-not-for-sale'>${notForSaleText}</div>`
					}
			})
		}
	})
})

rewriteStyles('rewrited-main.css')

observer.observe(document.querySelector('body'), observerConfig)

async function getInventoryThings() {
	const re = /\/profile\/([\w\.]+)\/inventory/
	let user_id = re.test(window.location.pathname) && window.location.pathname.match(re)[1]
	let formData = new FormData()
	if (user_id)
		formData.append('user_id', user_id)
	else
		formData.append('access_token', window.localStorage.getItem('access_token'))
	let inventoryThings = (await API('inventory.get', {
		body: formData
	})).things

	let thingPrototypeIds = new Set()
	inventoryThings.forEach(thing => {
		thingPrototypeIds.add(thing.thing_prototype_id)
	})
	thingPrototypeIds.forEach(async thingPrototypeId => {
		let formData = new FormData()
		formData.append('thing_prototype_id', thingPrototypeId)
		let bestThingPrice = (await API('market.getBestPrice', {
			body: formData
		})).price || noPriceText
		inventoryThings.forEach(thing => {
			if (thingPrototypeId === thing.thing_prototype_id)
				// can_sell: unixtime or -1 where lock for sale
				thing.price = thing.can_sell === -1 ? notForSaleText : bestThingPrice
		})
	})
	return inventoryThings
}

async function API(methodName, userOption = {}) {
	const url = `https://monopoly-one.com/api/${methodName}`
	if ('body' in userOption && !('method' in userOption))
		userOption.method = 'POST'
	let response = await fetch(url, userOption)
	let parsedResponse = await response.json()
	return parsedResponse.data
}

function rewriteStyles(fileName) {
	const url = `https://dtalkachou.github.io/m1-plus/css/${fileName}`
	let fileref = document.createElement('link')
	fileref.setAttribute('rel', 'stylesheet')
	fileref.setAttribute('type', 'text/css')
	fileref.setAttribute('href', url)
	document.querySelector('head').appendChild(fileref)
}