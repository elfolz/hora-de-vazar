if (location.protocol.startsWith('https')) {
	navigator.serviceWorker?.register('service-worker.js')
	navigator.serviceWorker.onmessage = m => {
		console.info('Update found!')
		if (m?.data == 'update') location.reload(true)
	}
}

function init() {
	document.querySelector('[data-type="carga"]').value = localStorage.getItem('carga') ?? '08:00'

	document.querySelector('[data-type="carga"]').onchange = e => {
		let value = e?.target?.value
		if (/\d{2}:\d{2}/.test(value)) localStorage.setItem('carga', value)
		else localStorage.removeItem('carga')
	}

	document.querySelector('#add').onclick = e => {
		let line = document.querySelector('section:first-of-type article:first-of-type').cloneNode(true)
		line.querySelectorAll('input').forEach(el => {el.value = ''; el.classList.remove('masked')})
		let section = document.querySelector('section:first-of-type')
		section.appendChild(line)
		createMask()
	}

	document.querySelector('#calc').onclick = e => {
		let error = false
		let jornada = convertHours(document.querySelector('[data-type="carga"]')?.value) ?? 28800000
		let horasTrabalhadas = 0
		let pausas = 0
		let horasExtra = 0
		let entradas = []
		let saidas = []
		document.querySelectorAll('article').forEach((line, i, a) => {
			if (error) return
			let entrada = null
			let saida = null
			for (let column of line.children) {
				input = column.querySelector('input')
				let date = convertTime(input.value)
				if (!date) return
				if (input.getAttribute('data-type') == 'in') {
					entrada = date.valueOf()
					entradas.push(entrada)
				} else {
					saida = date.valueOf()
					saidas.push(saida)
				}
			}
			if (entrada >= saida) {
				line.querySelector('input[data-type="out"]').classList.add('error')
				return error = true
			}
			if (entrada && saida) {
				horasTrabalhadas += (saida - entrada)
			} else if (entrada) {
				horasTrabalhadas += (Date.now() - entrada)
			}
			if (i > 0) {
				let pausaIn = a[i].querySelector('input[data-type="in"]')
				let pausaOut = a[i-1].querySelector('input[data-type="out"]')
				if (pausaIn) pausaIn = convertTime(pausaIn.value).valueOf()
				if (pausaOut) pausaOut = convertTime(pausaOut.value).valueOf()
				if (pausaIn && pausaOut) pausas += pausaIn - pausaOut
			}
		})
		if (error) return
		let extraInput = document.querySelector('input[data-type="extra"]')?.value
		if (extraInput) horasExtra = convertTime(extraInput)
		let primeiraEntrada = entradas.sort((a, b) => a - b)[0]
		let date = new Date(primeiraEntrada + jornada + pausas - horasExtra)
		if (date.getTime() !== date.getTime()) return
		let horaSaida = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
		document.querySelector('p').innerHTML = `Horário de saída:&nbsp;<strong>${horaSaida}</strong>`
	}
}

function convertTime(value) {
	let time = value?.split(':')
	if (!time) return
	let date = new Date()
	date.setHours(parseInt(time[0]), parseInt(time[1]), 0, 0)
	return date
}

function convertHours(value) {
	let time = value?.split(':')
	if (time?.length < 2) return null
	return (parseInt(time[0]) * 60 * 60 * 1000) + (parseInt(time[1]) * 60 * 1000)
}

function createMask() {
	document.querySelectorAll('input').forEach(el => {
		if (el.classList.contains('masked')) return
		if (el.getAttribute('data-type') == 'extra') {
			IMask(el, {
				mask: '[#]h[h]:m[m]',
				definitions: {
					'#': /[-|+]/,
					'h': /\d/,
					'm': /\d/
				}
			})
		} else {
			IMask(el, {
				mask: '00:00',
				blocks: {
					hh: {min: 0, max: 23, mask: '00'},
					mm: {min: 0, max: 59, mask: '00'}
				}
			})
		}
		el.oninput = e => {
			e.target.classList.remove('error')
		}
		el.classList.add('masked')
	})
}

document.onreadystatechange = () => {
	if (document.readyState != 'complete') return
	init()
	createMask()
}