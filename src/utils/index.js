export const getDistance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))

export const isPointOnLine = (x1, y1, x2, y2, x, y, maxDistance = 1) => {
	const a = { x: x1, y: y1 }
	const b = { x: x2, y: y2 }
	const c = { x, y }

	const offset = getDistance(a, b) - (getDistance(a, c) + getDistance(b, c))
	return Math.abs(offset) < maxDistance ? 'inside' : null
}

const isPointNear = (x, y, x1, y1, name) => {
	return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null
}

export const isCursorWithinElement = (x, y, element) => {
	const { type, x1, x2, y1, y2 } = element

	switch (type) {
		case 'line':
			const onLine = isPointOnLine(x1, y1, x2, y2, x, y)
			const start = isPointNear(x, y, x1, y1, 'start')
			const end = isPointNear(x, y, x2, y2, 'end')
			return start || end || onLine
		case 'rectangle':
			const topLeft = isPointNear(x, y, x1, y1, 'tl')
			const topRight = isPointNear(x, y, x2, y1, 'tr')
			const bottomLeft = isPointNear(x, y, x1, y2, 'bl')
			const bottomRight = isPointNear(x, y, x2, y2, 'br')
			const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? 'inside' : null
			return topLeft || topRight || bottomLeft || bottomRight || inside
		case 'pen':
			const betweenAnyPoint = element.points.some((point, index) => {
				const nextPoint = element.points[index + 1]

				if (!nextPoint) return false
				return isPointOnLine(point.x, point.y, nextPoint.x, nextPoint.y, x, y, 5) != null
			})

			return betweenAnyPoint ? 'inside' : null
		case 'text':
			return x >= x1 && x <= x2 && y >= y1 && y <= y2 ? 'inside' : null
		default:
			throw new Error(`Type not recognised: ${type}`)
	}
}

export const getElementAtCursor = (x, y, elements) => {
	return elements
		.map((element) => ({
			...element,
			position: isCursorWithinElement(x, y, element),
		}))
		.find((element) => element.position !== null)
}

export const getCursorForAction = (position) => {
	switch (position) {
		case 'tl':
		case 'br':
		case 'start':
		case 'end':
			return 'nwse-resize'
		case 'tr':
		case 'bl':
			return 'nesw-resize'
		default:
			return 'move'
	}
}

export const getResizedCoordinates = (mouseX, mouseY, position, coordinates) => {
	const { x1, y1, x2, y2 } = coordinates
	switch (position) {
		case 'tl':
		case 'start':
			return { x1: mouseX, y1: mouseY, x2, y2 }
		case 'tr':
			return { x1, y1: mouseY, x2: mouseX, y2 }
		case 'bl':
			return { x1: mouseX, y1, x2, y2: mouseY }
		case 'br':
		case 'end':
			return { x1, y1, x2: mouseX, y2: mouseY }
		default:
			return null
	}
}

export const adjustElementCoordinates = (element) => {
	const { type, x1, y1, x2, y2 } = element
	if (type === 'rectangle') {
		const minX = Math.min(x1, x2)
		const maxX = Math.max(x1, x2)
		const minY = Math.min(y1, y2)
		const maxY = Math.max(y1, y2)
		return { x1: minX, y1: minY, x2: maxX, y2: maxY }
	} else {
		if (x1 < x2 || (x1 === x2 && y1 < y2)) {
			return { x1, y1, x2, y2 }
		} else {
			return { x1: x2, y1: y2, x2: x1, y2: y1 }
		}
	}
}

export const adjustmentRequired = (type) => type === 'line' || type === 'rectangle'

export const getSvgPathFromStroke = (stroke) => {
	if (!stroke.length) return ''

	const d = stroke.reduce(
		(acc, [x0, y0], i, arr) => {
			const [x1, y1] = arr[(i + 1) % arr.length]
			acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
			return acc
		},
		['M', ...stroke[0], 'Q']
	)

	d.push('Z')
	return d.join(' ')
}
