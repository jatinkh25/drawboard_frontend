export const Line = ({ color, stroke, fill }) => {
	return (
		<svg
			width='500pt'
			height='600pt'
			version='1.1'
			viewBox='0 0 700 700'
			xmlns='http://www.w3.org/2000/svg'
			xmlnsXlink='http://www.w3.org/1999/xlink'
		>
			<g>
				<path
					color={color}
					stroke={stroke}
					fill={fill}
					d='m103.46 526.35-33.648-33.656 492.69-492.69 33.84 33.84 33.844 33.84-246.16 246.16c-135.39 135.39-246.33 246.16-246.54 246.16-0.21094 0-15.523-15.145-34.031-33.656z'
				/>
			</g>
		</svg>
	)
}
