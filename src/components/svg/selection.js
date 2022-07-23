export const Selection = ({ color, stroke, fill }) => {
	return (
		<svg
			xmlns='http://www.w3.org/2000/svg'
			xmlnsXlink='http://www.w3.org/1999/xlink'
			viewBox='0 0 16 16'
			color={color}
			stroke={stroke}
			fill={fill}
		>
			<defs>
				<path id='a' d='M0,0h2v2h-2Z' />
			</defs>
			<use transform='translate(3.75 12)' xlinkHref='#a' />
			<path d='M0,1c0,0.552246 0.447754,1 1,1h1v-2h-2v1Z' transform='translate(-.25 12)' />
			<use transform='translate(-.25 8)' xlinkHref='#a' />
			<use transform='translate(-.25 4)' xlinkHref='#a' />
			<path d='M0,1v1h2v-2h-1c-0.552246,0 -1,0.447754 -1,1Z' transform='translate(-.25)' />
			<use transform='translate(3.75)' xlinkHref='#a' />
			<use transform='translate(7.75)' xlinkHref='#a' />
			<path d='M2,1c0,-0.552246 -0.447754,-1 -1,-1h-1v2h2v-1Z' transform='translate(11.75)' />
			<use transform='translate(11.75 4)' xlinkHref='#a' />
			<path d='M0,0v9l3,-2.5h4Z' transform='translate(9.25 7)' />
		</svg>
	)
}
