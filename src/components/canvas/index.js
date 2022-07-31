import React, { useRef, useEffect, useState, useContext } from 'react'
import OptionsPalette from '../options_palette'
import { useParams } from 'react-router-dom'
import { getStroke } from 'perfect-freehand'
import {
	getElementAtCursor,
	getCursorType,
	getResizedCoordinates,
	adjustElementCoordinates,
	isAdjustmentRequired,
	getSvgPathFromStroke,
	calculateOffset,
	getUpdatedElements,
} from '../../utils'
import { io } from 'socket.io-client'
import CanvasContext from '../../context/canvas-context'
import { useElementState } from '../../hooks/use-element-state'
import './styles.css'

export default function Canvas() {
	const canvasRef = useRef(null)
	const contextRef = useRef(null)
	const [socket, setSocket] = useState()

	const [elements, setElements, undo, redo] = useElementState([])
	const {
		selectedMode,
		selectedElement,
		selectedBackground,
		strokeWidth,
		strokeColor,
		setSelectedElement,
	} = useContext(CanvasContext)

	const [action, setAction] = useState('none')

	const { id: documentId } = useParams()

	// useEffect for setting up canvas
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

	// getting the document from server when new user get connected to the room/document
	useEffect(() => {
		if (socket == null) return
		socket.emit('get-room', documentId)

		socket.on('load-document', (data) => {
			setElements(data)
		})
	}, [socket, documentId])

	// getting changes of other users connected on the same room
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

	// for rendering elements present in elements array according to their type
	useEffect(() => {
		if (!canvasRef || !canvasRef.current || !contextRef || !contextRef.current || !elements) return

		//clearing the canvas before every re-render
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

	const onMouseDownHandler = (e) => {
		e.preventDefault()

		const { clientX, clientY } = e
		const boundingRect = canvasRef.current.getBoundingClientRect()

		// getting mouse coordinates with respect to canvas
		const mouseX = clientX - boundingRect.left
		const mouseY = clientY - boundingRect.top

		if (selectedMode === 'eraser') {
			setAction('erasing')
			return
		}

		if (selectedMode === 'select') {
			// getting the element at the position of cursor
			const element = getElementAtCursor(mouseX, mouseY, elements)
			if (element == null) return

			// calculating offset of element with respect to mouse co-ordinates
			const offsetObj = calculateOffset(element, { x: mouseX, y: mouseY })

			setSelectedElement({ ...element, xOffset: offsetObj.xOffset, yOffset: offsetObj.yOffset })

			if (element.position === 'inside') {
				setAction('moving')
				setElements(elements)
			} else {
				setAction('resizing')
				setElements(elements)
			}
			return
		}

		// comes here if element has to drawn
		contextRef.current.beginPath()
		contextRef.current.moveTo(mouseX, mouseY)

		let element = null

		// getting the elementId of last element + 1
		const newElementId = elements.length ? elements[elements.length - 1].elementId + 1 : 0

		if (selectedMode === 'pen') {
			element = {
				elementId: newElementId,
				points: [{ x: mouseX, y: mouseY }],
				type: selectedMode,
				strokeColor: strokeColor,
				strokeWidth: strokeWidth,
			}
		} else {
			// line or rectangle
			element = {
				elementId: newElementId,
				x1: mouseX,
				y1: mouseY,
				type: selectedMode,
				strokeColor: strokeColor,
				strokeWidth: strokeWidth,
			}
		}

		// adding new element in the elements array
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

		// setting cursor type
		const element = getElementAtCursor(mouseX, mouseY, elements)
		if (action === 'none') {
			if (selectedMode === 'eraser') {
				e.target.style.cursor = element ? 'pointer' : 'default'
			} else if (selectedMode === 'select') {
				e.target.style.cursor = element ? getCursorType(element.position) : 'default'
			}
			return
		}

		if (action === 'erasing') {
			const elementToBeErased = getElementAtCursor(mouseX, mouseY, elements)

			if (elementToBeErased && elementToBeErased.position === 'inside') {
				// filtering elements on the basis of elementId
				const newElements = elements.filter(
					(element) => element.elementId !== elementToBeErased.elementId
				)

				setElements(newElements)
				socket.emit('elements-change', newElements)
			}
			return
		}

		if (action === 'drawing') {
			// getting the elementId of last element + 1
			const elementId = elements.length ? elements[elements.length - 1].elementId : 0

			const updatedElements = getUpdatedElements(elements, {
				elementId: elementId,
				x2: mouseX,
				y2: mouseY,
			})
			setElements(updatedElements, true)
			return
		}

		if (action === 'moving') {
			if (selectedElement.type === 'pen') {
				// calculating new points according to offset of each point
				const newPoints = selectedElement.points.map((_, index) => ({
					x: mouseX - selectedElement.xOffset[index],
					y: mouseY - selectedElement.yOffset[index],
				}))

				const newElements = [...elements]
				let elementIndex = newElements.findIndex(
					(element) => element.elementId === selectedElement.elementId
				)
				newElements[elementIndex] = {
					...newElements[elementIndex],
					points: newPoints,
				}
				setElements(newElements, true)
			} else {
				const { elementId, x1, x2, y1, y2, type, xOffset, yOffset } = selectedElement
				const width = x2 - x1
				const height = y2 - y1

				// calculating new point according to offset of prev point
				const newX1 = mouseX - xOffset
				const newY1 = mouseY - yOffset
				const updatedElements = getUpdatedElements(elements, {
					elementId,
					x1: newX1,
					y1: newY1,
					x2: newX1 + width,
					y2: newY1 + height,
					type,
				})
				setElements(updatedElements, true)
			}
			return
		}

		// comes here if action === "resizing"
		const { elementId, type, position, ...coordinates } = selectedElement
		const { x1, y1, x2, y2 } = getResizedCoordinates(mouseX, mouseY, position, coordinates)
		const updatedElements = getUpdatedElements(elements, { elementId, x1, y1, x2, y2, type })
		setElements(updatedElements, true)
	}

	const onMouseUpHandler = (e) => {
		e.preventDefault()

		if (selectedElement === null) {
			setAction('none')
			return
		}

		let elementIndex = elements.findIndex(
			(element) => element.elementId === selectedElement.elementId
		)

		const { elementId, type } = elements[elementIndex]
		if ((action === 'drawing' || action === 'resizing') && isAdjustmentRequired(type)) {
			// keeping top-left corner as (x1,y1) & bottom-right as (x2,y2)
			const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[elementIndex])
			const updatedElements = getUpdatedElements(elements, { elementId, x1, y1, x2, y2, type })
			setElements(updatedElements, true)
		}

		socket.emit('elements-change', elements)
		setSelectedElement(null)
		setAction('none')
	}

	const clearCanvas = (e) => {
		e.preventDefault()
		socket.emit('elements-change', [])
		setElements([])
	}

	return (
		<>
			<strong className='heading'>Drawboard</strong>
			<canvas
				ref={canvasRef}
				onMouseDown={onMouseDownHandler}
				onMouseUp={onMouseUpHandler}
				onMouseMove={onMouseMoveHandler}
				className={['canvas', selectedBackground].join(' ')}
			></canvas>

			<OptionsPalette />

			<div className='canvas_options'>
				<span onClick={undo}>Undo</span>
				<span onClick={redo}>Redo</span>
				<span onClick={clearCanvas}>Clear</span>
			</div>
		</>
	)
}
