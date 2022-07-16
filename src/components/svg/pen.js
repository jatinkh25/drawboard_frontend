export const Pen = ({ color, stroke, fill }) => {
	return (
		<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 48 48'>
			<path
				color={color}
				stroke={stroke}
				fill={fill}
				d='M46.242 10.245l-4.467 4.467-8.616-8.352 4.599-4.599a5.999 5.999 0 1 1 8.484 8.484zm-7.083 7.08L11.694 44.79 0 48.048l3.207-11.739L30.57 8.946l8.589 8.379z'
			/>
		</svg>
	)
}
