export const Rectangle = ({ color, stroke, fill }) => {
	return (
		<svg
			version='1.1'
			id='Layer_1'
			xmlns='http://www.w3.org/2000/svg'
			xmlnsXlink='http://www.w3.org/1999/xlink'
			x='0px'
			y='0px'
			viewBox='0 0 512 512'
			xmlSpace='preserve'
		>
			<g>
				<g>
					<path
						color={color}
						stroke={stroke}
						fill={fill}
						d='M501.333,96H10.667C4.779,96,0,100.779,0,106.667v298.667C0,411.221,4.779,416,10.667,416h490.667
			c5.888,0,10.667-4.779,10.667-10.667V106.667C512,100.779,507.221,96,501.333,96z M490.667,394.667H21.333V117.333h469.333
			V394.667z'
						strokeWidth='15px'
					/>
				</g>
			</g>
		</svg>
	)
}
