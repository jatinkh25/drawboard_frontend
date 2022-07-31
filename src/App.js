import './App.css'
import Canvas from './components/canvas'
import { BrowserRouter as Routers, Routes, Route, Navigate } from 'react-router-dom'
import { CanvasProvider } from './context/canvas-context'
import { v4 as uuidV4 } from 'uuid'

function App() {
	return (
		<div className='canvas_container'>
			<CanvasProvider>
				<Routers>
					<Routes>
						<Route path='/documents/:id' element={<Canvas />} />
						<Route path='/' element={<Navigate to={`/documents/${uuidV4()}`} />} />
					</Routes>
				</Routers>
			</CanvasProvider>
		</div>
	)
}

export default App
