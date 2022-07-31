import React, { useState, useContext } from 'react'
import { copyLinkToClipboard } from '../../utils'
import CanvasContext from '../../context/canvas-context'
import { Eraser, Line, Pen, Rectangle, Selection, Share, Stroke, Background } from '../svg'
import './styles.css'

const OptionsPalette = () => {
	const {
		selectedMode,
		strokeWidth,
		strokeColor,
		selectedBackground,
		setSelectedMode,
		setStrokeColor,
		setStrokeWidth,
		setSelectedBackground,
	} = useContext(CanvasContext)

	const [hoveredOptionId, setHoveredOptionId] = useState(null)
	const [showStrokeMenu, setShowStrokeMenu] = useState(false)
	const [showBackgroundMenu, setShowBackgroundMenu] = useState(false)

	const changeIconStateHandler = (mode) => {
		setShowStrokeMenu(false)
		setSelectedMode(mode)
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

	const backgroundOptionsArray = [
		{ name: 'White', classname: 'white' },
		{ name: 'Dotted v1', classname: 'dotted_v1' },
		{ name: 'Dotted v2', classname: 'dotted_v2' },
		{ name: 'Line v1', classname: 'line_v1' },
		{ name: 'Line v2', classname: 'line_v2' },
		{ name: 'Rectangles', classname: 'rectangles' },
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

	const strokeWidthArray = Array(20)
		.fill()
		.map((_, idx) => 1 + idx)

	return (
		<div className='options_container' onMouseLeave={() => setShowStrokeMenu(false)}>
			<div
				className='share_icon_container'
				onClick={copyLinkToClipboard}
				onMouseEnter={() => setHoveredOptionId(0)}
				onMouseLeave={() => setHoveredOptionId(null)}
			>
				<Share fill='#fff' />
				<div className={['hover_text_container', hoveredOptionId === 0 ? 'show' : null].join(' ')}>
					<span>Share</span>
				</div>
			</div>

			<div className='color_container'>{colorComp}</div>

			<div className='bg_options_container'>
				<div className={['hover_text_container', hoveredOptionId === 1 ? 'show' : null].join(' ')}>
					<span>Background Options</span>
				</div>

				<div
					className='bg_option_icon'
					onMouseEnter={() => setHoveredOptionId(1)}
					onMouseLeave={() => setHoveredOptionId(null)}
					onClick={() => setShowBackgroundMenu(true)}
				>
					<Background />
				</div>

				<div
					className={['background_options_menu', showBackgroundMenu && 'show_bg_options_menu'].join(
						' '
					)}
					onMouseOver={() => setShowBackgroundMenu(true)}
					onMouseLeave={() => setShowBackgroundMenu(false)}
				>
					{backgroundOptionsArray.map((option) => {
						return (
							<div
								key={option.classname}
								className={[
									'bg_option',
									selectedBackground === option.classname ? 'selected_background' : null,
								].join(' ')}
								onClick={() => setSelectedBackground(option.classname)}
							>
								<p>{option.name}</p>
							</div>
						)
					})}
				</div>
			</div>

			<div
				className={selectedMode === 'pen' ? 'svg_icon pen click' : 'svg_icon pen'}
				onClick={() => changeIconStateHandler('pen')}
				onMouseEnter={() => setHoveredOptionId(2)}
				onMouseLeave={() => setHoveredOptionId(null)}
			>
				<Pen fill={selectedMode === 'pen' ? '#fff' : '#000'} />
				<div className={['hover_text_container', hoveredOptionId === 2 ? 'show' : null].join(' ')}>
					<span>Pen</span>
				</div>
			</div>

			<div
				className={selectedMode === 'eraser' ? 'svg_icon eraser click' : 'svg_icon eraser'}
				onClick={() => changeIconStateHandler('eraser')}
				onMouseEnter={() => setHoveredOptionId(3)}
				onMouseLeave={() => setHoveredOptionId(null)}
			>
				<Eraser stroke={selectedMode === 'eraser' ? '#fff' : null} hoverText='Eraser' />
				<div className={['hover_text_container', hoveredOptionId === 3 ? 'show' : null].join(' ')}>
					<span>Eraser</span>
				</div>
			</div>

			<div className='stroke_menu_container'>
				<div
					className='svg_icon stroke'
					onClick={() => setShowStrokeMenu(true)}
					onMouseEnter={() => setHoveredOptionId(4)}
					onMouseLeave={() => setHoveredOptionId(null)}
				>
					<Stroke />
					<div
						className={['hover_text_container', hoveredOptionId === 4 ? 'show' : null].join(' ')}
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
				className={selectedMode === 'line' ? 'svg_icon line click' : 'svg_icon line'}
				onClick={() => changeIconStateHandler('line')}
				onMouseEnter={() => setHoveredOptionId(5)}
				onMouseLeave={() => setHoveredOptionId(null)}
			>
				<Line fill={selectedMode === 'line' ? '#fff' : '#000'} />
				<div className={['hover_text_container', hoveredOptionId === 5 ? 'show' : null].join(' ')}>
					<span>Line</span>
				</div>
			</div>

			<div
				className={selectedMode === 'rectangle' ? 'svg_icon rectangle click' : 'svg_icon rectangle'}
				onClick={() => changeIconStateHandler('rectangle')}
				onMouseEnter={() => setHoveredOptionId(6)}
				onMouseLeave={() => setHoveredOptionId(null)}
			>
				<Rectangle
					stroke={selectedMode === 'rectangle' ? '#fff' : '#000'}
					fill={selectedMode === 'rectangle' ? '#fff' : '#000'}
				/>
				<div className={['hover_text_container', hoveredOptionId === 6 ? 'show' : null].join(' ')}>
					<span>Rectangle</span>
				</div>
			</div>

			<div
				className={selectedMode === 'select' ? 'svg_icon select click' : 'svg_icon select'}
				onClick={() => changeIconStateHandler('select')}
				onMouseEnter={() => setHoveredOptionId(7)}
				onMouseLeave={() => setHoveredOptionId(null)}
			>
				<Selection fill={selectedMode === 'select' ? '#fff' : '#000'} />
				<div className={['hover_text_container', hoveredOptionId === 7 ? 'show' : null].join(' ')}>
					<span>Select</span>
				</div>
			</div>
		</div>
	)
}

export default OptionsPalette
