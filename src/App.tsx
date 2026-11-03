import { Scene } from './components/Scene'
import { Hud } from './components/Hud'

export default function App() {
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <Scene />
      <Hud />
    </div>
  )
}
