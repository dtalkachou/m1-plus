const observerConfig = {
	childList : true,
	subtree: true
}

const thingPrices = {}
const thingId = {}

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
						priceDiv.className = "thing-price"

						priceDiv.innerHTML = '<div class="content-ph"></div>'

						let thingContentDiv = document.createElement('div')
						thingContentDiv.className = "thing-contnent"
						thingContentDiv.appendChild(node.firstChild)
						thingContentDiv.appendChild(priceDiv)
						node.insertBefore(thingContentDiv, node.firstChild)
					}
			})
			
			// const re = /\/profile\/([\w\.]+)\/inventory/
			// let user_id = re.test(window.location.pathname) && window.location.pathname.match(re)[1]

			// let formData = new FormData()
			// let endpoint = 'inventory.get'
			// if (user_id)
			// 	formData.append('user_id', user_id)
			// else
			// 	formData.append('access_token', window.localStorage.getItem('access_token'))

			// let inventoryResponse = await API('inventory.get', {
			// 	body: formData
			// })

			// let thingPrototypeIds = new Set()
			// inventoryResponse.things.forEach(thing => {
			// 	thingPrototypeIds.add(thing.thing_prototype_id)
			// })

			// thingPrototypeIds.forEach(async thingPrototypeId => {
			// 	let formData = new FormData()
			// 	formData.append('thing_prototype_id', thingPrototypeId)
			// 	let bestPriceResponse = await API('market.getBestPrice', {
			// 		body: formData
			// 	})
			// 	let bestPrice = bestPriceResponse.price
			// 	inventoryResponse.things.filter(thing => thing.thing_prototype_id === thingPrototypeId)
			// 		.forEach(thing => {
			// 			let thingDiv = document.querySelector(`div[mnpl-inventory-thingid="${thing.thing_id}"]`)

			// 			if (thingDiv) {
			// 				// thingDiv is null when filter setted
							// let priceDiv = document.createElement('div')
							// priceDiv.className = "thing-price"
							// priceDiv.innerHTML = bestPrice ? `${bestPrice} р.` : 'отсутствует'

							// let thingContentDiv = document.createElement('div')
							// thingContentDiv.className = "thing-contnent"
							// thingContentDiv.appendChild(thingDiv.firstChild)
							// thingContentDiv.appendChild(priceDiv)
							// thingDiv.insertBefore(thingContentDiv, thingDiv.firstChild)
			// 			}
			// 			// todo: write code when filter changed
			// 		})

			// })
		}
	})
})

rewriteStyles('rewrited-main.css')
observer.observe(document.querySelector('body'), observerConfig)

async function getInventory() {
	const re = /\/profile\/([\w\.]+)\/inventory/
	let user_id = re.test(window.location.pathname) && window.location.pathname.match(re)[1]
	if (user_id)
		formData.append('user_id', user_id)
	else
		formData.append('access_token', window.localStorage.getItem('access_token'))

	let response = await API('inventory.get', {
		body: formData
	})
	return response
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