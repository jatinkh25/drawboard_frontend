import React, { useRef, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getStroke } from 'perfect-freehand'
import { Eraser, Line, Pen, Rectangle, Selection, Share, Stroke } from '../svg'
import {
	getElementAtCursor,
	getCursorForAction,
	getResizedCoordinates,
	adjustElementCoordinates,
	adjustmentRequired,
	getSvgPathFromStroke,
	copyLinkToClipboard,
} from '../../utils'
import { io } from 'socket.io-client'
import { useElementState } from '../../hooks/use-element-state'
import './styles.css'

export default function Canvas() {
	const canvasRef = useRef(null)
	const contextRef = useRef(null)
	const [selectedMode, setSelectedMode] = useState('pen')
	const [strokeWidth, setStrokeWidth] = useState(3)
	const [strokeColor, setStrokeColor] = useState('#000000')
	const [mousePressed, setMousePressed] = useState(false)
	const [hoveredOptionId, setHoveredOptionId] = useState(null)
	const [showStrokeMenu, setShowStrokeMenu] = useState(false)
	const [elements, setElements, undo, redo] = useElementState([])
	const [iconsClickedState, setIconsClickedState] = useState([true, ...Array(4).fill(false)])
	const [action, setAction] = useState('none')
	const [selectedElement, setSelectedElement] = useState(null)
	const [socket, setSocket] = useState()
	const { id: documentId } = useParams()

	//useEffect for setting up canvas
	useEffect(() => {
		const canvas = canvasRef.current

		canvas.width = window.innerWidth
		canvas.height = window.innerHeight

		const context = canvas.getContext('2d')
		context.lineWidth = strokeWidth
		context.lineCap = 'round'
		contextRef.current = context
	}, [strokeWidth])

	useEffect(() => {
		const s = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001')
		setSocket(s)

		return () => {
			s.disconnect()
		}
	}, [])

	//getting the document from server when new user get connected to the room
	useEffect(() => {
		if (socket == null || socket === undefined) return
		socket.emit('get-room', documentId)

		socket.on('load-document', (data) => {
			setElements(data)
		})
	}, [socket, documentId])

	//getting changes of other users connected on the same room
	useEffect(() => {
		if (socket == null) return
		const handleChange = (data) => {
			setElements(data)
		}

		socket.on('get-element-changes', handleChange)

		return () => {
			socket.off('get-element-changes', handleChange)
		}
	}, [socket])

	//for rendering all elements present in elements array
	useEffect(() => {
		if (!canvasRef || !canvasRef.current || !contextRef || !contextRef.current || !elements) return

		//clearing the canvas before every rerender
		contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

		for (let element of elements) {
			contextRef.current.beginPath()
			contextRef.current.lineWidth = element.strokeWidth
			switch (element.type) {
				case 'pen':
					const stroke = getStroke(element.points, {
						size: element.strokeWidth + 2,
						thinning: 0.5,
						smoothing: 0.5,
						streamline: 0.55,
					})
					contextRef.current.fillStyle = element.strokeColor
					const pathData = getSvgPathFromStroke(stroke)
					contextRef.current.fill(new Path2D(pathData))
					break
				case 'line':
					contextRef.current.lineCap = 'butt'
					contextRef.current.strokeStyle = element.strokeColor
					contextRef.current.moveTo(element.x1, element.y1)
					contextRef.current.lineTo(element.x2, element.y2)
					break
				case 'rectangle':
					contextRef.current.strokeStyle = element.strokeColor
					contextRef.current.lineCap = 'butt'
					contextRef.current.strokeRect(
						element.x1,
						element.y1,
						element.x2 - element.x1,
						element.y2 - element.y1
					)
					break
				default:
					throw new Error('Selected Option not identified.')
			}
			contextRef.current.stroke()
		}
	}, [elements, strokeWidth])

	useEffect(() => {
		const undoRedoFunction = (event) => {
			event.preventDefault()

			if (event.ctrlKey) {
				if (event.key === 'z') {
					undo()
				} else if (event.key === 'y') {
					redo()
				}
			}
		}
		document.addEventListener('keydown', undoRedoFunction)
		return () => {
			document.removeEventListener('keydown', undoRedoFunction)
		}
	}, [undo, redo])

	useEffect(() => {
		const mouseDown = () => setMousePressed(true)
		const mouseUp = () => setMousePressed(false)

		document.querySelector('canvas').addEventListener('mousedown', mouseDown)
		document.querySelector('canvas').addEventListener('mouseup', mouseUp)

		return () => {
			document.querySelector('canvas').removeEventListener('mousedown', mouseDown)
			document.querySelector('canvas').removeEventListener('mouseup', mouseUp)
		}
	}, [])

	const onMouseDownHandler = (e) => {
		e.preventDefault()
		const { clientX, clientY } = e
		const boundingRect = canvasRef.current.getBoundingClientRect()

		//getting mouse coordinates with respect to canvas
		const mouseX = clientX - boundingRect.left
		const mouseY = clientY - boundingRect.top

		if (selectedMode === 'eraser') {
			const eraElement = getElementAtCursor(mouseX, mouseY, elements)
			if (eraElement && eraElement.position === 'inside') {
				const newElements = elements.filter((element) => element.elementId !== eraElement.elementId)
				setElements(newElements)
				socket.emit('elements-change', newElements)
			}
			return
		}

		if (selectedMode === 'select') {
			//getting the element at the position of cursor
			const element = getElementAtCursor(mouseX, mouseY, elements)
			if (element) {
				if (element.type === 'pen') {
					const xOffsets = element.points.map((point) => mouseX - point.x)
					const yOffsets = element.points.map((point) => mouseY - point.y)
					setSelectedElement({ ...element, xOffsets, yOffsets })
				} else {
					const offsetX = mouseX - element.x1
					const offsetY = mouseY - element.y1
					setSelectedElement({ ...element, offsetX, offsetY })
				}

				if (element.position === 'inside') {
					setAction('moving')
					setElements(elements)
				} else {
					setAction('resizing')
					setElements(elements)
				}
			}
			return
		}

		//comes here if element has to drawn
		contextRef.current.beginPath()
		contextRef.current.moveTo(mouseX, mouseY)
		let element = null
		if (selectedMode === 'pen') {
			element = {
				elementId: elements.length,
				points: [{ x: mouseX, y: mouseY }],
				type: selectedMode,
				strokeColor: strokeColor,
				strokeWidth: strokeWidth,
			}
		} else {
			element = {
				elementId: elements.length,
				x1: mouseX,
				y1: mouseY,
				type: selectedMode,
				strokeColor: strokeColor,
				strokeWidth: strokeWidth,
			}
		}

		//adding new element in the elements array
		setElements([...elements, element])
		setSelectedElement(element)
		setAction('drawing')
	}

	const onMouseMoveHandler = (e) => {
		e.preventDefault()
		const { clientX, clientY } = e
		const boundingRect = canvasRef.current.getBoundingClientRect()
		const mouseX = clientX - boundingRect.left
		const mouseY = clientY - boundingRect.top

		if (selectedMode === 'eraser' && mousePressed) {
			const eraElement = getElementAtCursor(mouseX, mouseY, elements)
			if (eraElement && eraElement.position === 'inside') {
				const newElements = elements.filter((element) => element.elementId !== eraElement.elementId)
				setElements(newElements)
				socket.emit('elements-change', newElements)
			}
			return
		}

		//if user not drawing or element is not moving
		const element = getElementAtCursor(mouseX, mouseY, elements)
		if (action === 'none') {
			if (selectedMode === 'eraser') {
				e.target.style.cursor = element ? 'pointer' : 'default'
			} else if (selectedMode === 'select') {
				e.target.style.cursor = element ? getCursorForAction(element.position) : 'default'
			}
			return
		}

		if (action === 'drawing') {
			const elementId = elements.length - 1
			updateElement({ elementId: elementId, x2: mouseX, y2: mouseY })
		} else if (action === 'moving') {
			if (selectedElement.type === 'pen') {
				const newPoints = selectedElement.points.map((_, index) => ({
					x: mouseX - selectedElement.xOffsets[index],
					y: mouseY - selectedElement.yOffsets[index],
				}))
				const elementsCopy = [...elements]
				elementsCopy[selectedElement.elementId] = {
					...elementsCopy[selectedElement.elementId],
					points: newPoints,
				}
				setElements(elementsCopy, true)
			} else {
				const { elementId, x1, x2, y1, y2, type, offsetX, offsetY } = selectedElement
				const width = x2 - x1
				const height = y2 - y1
				const newX1 = clientX - boundingRect.left - offsetX
				const newY1 = clientY - boundingRect.top - offsetY
				updateElement({
					elementId,
					x1: newX1,
					y1: newY1,
					x2: newX1 + width,
					y2: newY1 + height,
					type,
				})
			}
		} else {
			//comes here if action === "resizing"
			const { elementId, type, position, ...coordinates } = selectedElement
			const { x1, y1, x2, y2 } = getResizedCoordinates(mouseX, mouseY, position, coordinates)
			updateElement({ elementId, x1, y1, x2, y2, type })
		}
	}

	const onMouseUpHandler = (e) => {
		e.preventDefault()
		if (selectedElement === null) {
			setAction('none')
			return
		}
		const index = selectedElement.elementId
		const { elementId, type } = elements[index]
		if ((action === 'drawing' || action === 'resizing') && adjustmentRequired(type)) {
			const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[index])
			updateElement({ elementId, x1, y1, x2, y2, type })
		}
		socket.emit('elements-change', elements)
		setSelectedElement(null)
		setAction('none')
	}

	const updateElement = (element, overwriteLastElement = true) => {
		const elementsCopy = [...elements]
		let elementId = element.elementId
		const updatedElement = { ...elementsCopy[elementId], ...element }
		const { x2, y2, type } = updatedElement
		switch (type) {
			case 'line':
			case 'rectangle':
				elementsCopy[elementId] = updatedElement
				break
			case 'pen':
				elementsCopy[elementId].points = [...elementsCopy[elementId].points, { x: x2, y: y2 }]
				break
			default:
				throw new Error('Selected Option not identified.')
		}

		setElements(elementsCopy, overwriteLastElement)
	}

	const changeIconStateHandler = (idx) => {
		setShowStrokeMenu(false)
		const iconStateArr = Array(iconsClickedState.length).fill(false)
		iconStateArr[idx] = true
		setIconsClickedState(iconStateArr)
		switch (idx) {
			case 0:
				setSelectedMode('pen')
				break
			case 1:
				setSelectedMode('eraser')
				break
			case 2:
				setSelectedMode('line')
				break
			case 3:
				setSelectedMode('rectangle')
				break
			case 4:
				setSelectedMode('select')
				break
			default:
				throw new Error('Selected Option not identified.')
		}
	}

	const clearCanvas = (e) => {
		e.preventDefault()
		setElements([])
	}

	const onWidthOptionClickHandler = (e, width) => {
		e.preventDefault()
		setStrokeWidth(width)
		setShowStrokeMenu(false)
	}

	const strokeColorsArray = [
		{ name: 'black', value: '#000000' },
		{ name: 'pink', value: '#e91e63' },
		{ name: 'yellow', value: '#ffc107' },
		{ name: 'blue', value: '#00bcd4' },
		{ name: 'peach', value: '#FF677D' },
	]

	const colorComp = strokeColorsArray.map((color) => {
		return (
			<div
				key={color.value}
				onClick={() => setStrokeColor(color.value)}
				className={[
					`color ${color.name}`,
					strokeColor === color.value ? 'selected_color' : null,
				].join(' ')}
			></div>
		)
	})

	const strokeWidthArray = Array(19)
		.fill()
		.map((_, idx) => 2 + idx)

	return (
		<>
			<strong className='heading'>Drawboard</strong>
			<canvas
				ref={canvasRef}
				onMouseDown={onMouseDownHandler}
				onMouseUp={onMouseUpHandler}
				onMouseMove={onMouseMoveHandler}
			></canvas>

			<div className='canvas_options'>
				<span onClick={undo}>Undo</span>
				<span onClick={redo}>Redo</span>
				<span onClick={clearCanvas}>Clear</span>
			</div>

			<div className='options_container' onMouseLeave={() => setShowStrokeMenu(false)}>
				<div
					className='share_icon_container'
					onClick={copyLinkToClipboard}
					onMouseEnter={() => setHoveredOptionId(0)}
					onMouseLeave={() => setHoveredOptionId(null)}
				>
					<Share fill='#fff' />
					<div
						className={['hover_text_container', hoveredOptionId === 0 ? 'show' : null].join(' ')}
					>
						<span>Share</span>
					</div>
				</div>
				<div className='color_container'>{colorComp}</div>
				<div
					className={iconsClickedState[0] ? 'svg_icon pen click' : 'svg_icon pen'}
					onClick={() => changeIconStateHandler(0)}
					onMouseEnter={() => setHoveredOptionId(1)}
					onMouseLeave={() => setHoveredOptionId(null)}
				>
					<Pen
						stroke={iconsClickedState[0] ? '#fff' : null}
						fill={iconsClickedState[0] ? '#fff' : '#000'}
					/>
					<div
						className={['hover_text_container', hoveredOptionId === 1 ? 'show' : null].join(' ')}
					>
						<span>Pen</span>
					</div>
				</div>

				<div
					className={iconsClickedState[1] ? 'svg_icon eraser click' : 'svg_icon eraser'}
					onClick={() => changeIconStateHandler(1)}
					onMouseEnter={() => setHoveredOptionId(2)}
					onMouseLeave={() => setHoveredOptionId(null)}
				>
					<Eraser stroke={iconsClickedState[1] ? '#fff' : null} hoverText='Eraser' />
					<div
						className={['hover_text_container', hoveredOptionId === 2 ? 'show' : null].join(' ')}
					>
						<span>Eraser</span>
					</div>
				</div>

				<div className='stroke_menu_container'>
					<div
						className='svg_icon stroke'
						onClick={() => setShowStrokeMenu(true)}
						onMouseEnter={() => setHoveredOptionId(3)}
						onMouseLeave={() => setHoveredOptionId(null)}
					>
						<Stroke />
						<div
							className={['hover_text_container', hoveredOptionId === 3 ? 'show' : null].join(' ')}
						>
							<span>Stroke Width</span>
						</div>
					</div>

					<div
						className={['stroke_menu_wrapper', showStrokeMenu && 'show'].join(' ')}
						onMouseOver={() => setShowStrokeMenu(true)}
						onMouseLeave={() => setShowStrokeMenu(false)}
					>
						<ul className='stroke_width_menu'>
							{strokeWidthArray.map((num) => {
								return (
									<li
										key={num}
										className={[
											'stroke_menu_option',
											strokeWidth === num && 'selected_menu_option',
										].join(' ')}
										onClick={(e) => onWidthOptionClickHandler(e, num)}
									>
										<span>{num}</span>
									</li>
								)
							})}
						</ul>
					</div>
				</div>

				<div
					className={iconsClickedState[2] ? 'svg_icon line click' : 'svg_icon line'}
					onClick={() => changeIconStateHandler(2)}
					onMouseEnter={() => setHoveredOptionId(4)}
					onMouseLeave={() => setHoveredOptionId(null)}
				>
					<Line fill={iconsClickedState[2] ? '#fff' : '#000'} />
					<div
						className={['hover_text_container', hoveredOptionId === 4 ? 'show' : null].join(' ')}
					>
						<span>Line</span>
					</div>
				</div>

				<div
					className={iconsClickedState[3] ? 'svg_icon rectangle click' : 'svg_icon rectangle'}
					onClick={() => changeIconStateHandler(3)}
					onMouseEnter={() => setHoveredOptionId(5)}
					onMouseLeave={() => setHoveredOptionId(null)}
				>
					<Rectangle
						stroke={iconsClickedState[3] ? '#fff' : '#000'}
						fill={iconsClickedState[3] ? '#fff' : '#000'}
					/>
					<div
						className={['hover_text_container', hoveredOptionId === 5 ? 'show' : null].join(' ')}
					>
						<span>Rectangle</span>
					</div>
				</div>

				<div
					className={iconsClickedState[4] ? 'svg_icon select click' : 'svg_icon select'}
					onClick={() => changeIconStateHandler(4)}
					onMouseEnter={() => setHoveredOptionId(6)}
					onMouseLeave={() => setHoveredOptionId(null)}
				>
					<Selection
						color={iconsClickedState[4] ? '#fff' : '#000'}
						stroke={iconsClickedState[4] ? '#fff' : null}
						fill={iconsClickedState[4] ? '#fff' : '#000'}
					/>
					<div
						className={['hover_text_container', hoveredOptionId === 6 ? 'show' : null].join(' ')}
					>
						<span>Select</span>
					</div>
				</div>
			</div>
		</>
	)
}
