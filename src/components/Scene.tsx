import { useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Terrain } from './Terrain'
import { Cableway } from './Cableway'
import { CableCars } from './CableCars'
import { Lighting } from './Lighting'
import { QueueCrowd } from './QueueCrowd'
import { AudioDriver } from './AudioDriver'
import { useRideStore } from '../store/useRideStore'

type Controls = React.ComponentRef<typeof OrbitControls>

function CameraRig() {
  const riding = useRideStore((s) => s.riding)
  const camera = useThree((s) => s.camera)
  const controls = useRef<Controls>(null)

  useEffect(() => {
    if (riding) return
    camera.position.set(-10, 40, 75)
    controls.current?.target.set(0, 14, 0)
    controls.current?.update()
  }, [riding, camera])

  // While riding, the orbit pivot is the passenger's head, so dragging looks around.
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableZoom={!riding}
      enablePan={!riding}
      rotateSpeed={riding ? -0.5 : 1}
      maxPolarAngle={riding ? Math.PI : Math.PI / 2.05}
    />
  )
}

export function Scene() {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [-10, 40, 75], fov: 55, near: 0.1, far: 1500 }}>
      <Lighting />
      <Terrain />
      <Cableway />
      <CableCars />
      <QueueCrowd />
      <AudioDriver />
      <CameraRig />
    </Canvas>
  )
}
