import { createContext, useState } from 'react'

const CanvasContext = createContext()

export function CanvasProvider({ children }) {
	const [selectedMode, setSelectedMode] = useState('pen')
	const [selectedElement, setSelectedElement] = useState(null)

	const [strokeWidth, setStrokeWidth] = useState(3)
	const [strokeColor, setStrokeColor] = useState('#000000')
	const [selectedBackground, setSelectedBackground] = useState('dotted_v1')

	return (
		<CanvasContext.Provider
			value={{
				selectedMode,
				selectedElement,
				strokeWidth,
				strokeColor,
				selectedBackground,
				setSelectedElement,
				setSelectedMode,
				setStrokeColor,
				setStrokeWidth,
				setSelectedBackground,
			}}
		>
			{children}
		</CanvasContext.Provider>
	)
}

export default CanvasContext
