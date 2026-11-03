import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { CABIN_COUNT, HANG, LOOP, cableY, pathAt } from '../lib/cableway'
import { useRideStore } from '../store/useRideStore'

const COLORS = ['#e8b33a', '#d9483b', '#3b8fd9', '#4fb37a']
const eye = new THREE.Vector3(0.5, -HANG - 1.0, 0)
const ahead = new THREE.Vector3(24, -HANG - 3.5, 0)

function Cabin({ color }: { color: string }) {
  return (
    <>
      <mesh position={[0, -HANG / 2, 0]}>
        <cylinderGeometry args={[0.06, 0.06, HANG, 6]} />
        <meshStandardMaterial color="#2a2d33" metalness={0.6} />
      </mesh>
      <mesh position={[0, -HANG - 0.05, 0]}>
        <boxGeometry args={[3.4, 0.25, 2.2]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, -HANG - 1.0, 0]}>
        <boxGeometry args={[3.2, 1.7, 2.0]} />
        <meshStandardMaterial color="#bfe3f5" transparent opacity={0.45} roughness={0.1} />
      </mesh>
      <mesh position={[0, -HANG - 1.95, 0]}>
        <boxGeometry args={[3.4, 0.25, 2.2]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </>
  )
}

export function Cabins() {
  const refs = useRef<(THREE.Group | null)[]>([])
  const distance = useRef(0)
  const camera = useThree((s) => s.camera)

  useFrame((state, delta) => {
    const { speed, riding } = useRideStore.getState()
    distance.current = (distance.current + speed * Math.min(delta, 0.1)) % LOOP

    refs.current.forEach((g, i) => {
      if (!g) return
      const p = pathAt((distance.current + (i * LOOP) / CABIN_COUNT) % LOOP)
      g.position.set(p.x, cableY(p.x), p.z)
      g.rotation.y = Math.atan2(-p.dz, p.dx)
      g.rotation.x = Math.sin(state.clock.elapsedTime * 1.2 + i * 2) * 0.025
      g.updateMatrixWorld()

      if (i === 0 && riding) {
        camera.position.copy(g.localToWorld(eye.clone()))
        camera.lookAt(g.localToWorld(ahead.clone()))
      }
    })
  })

  return (
    <>
      {Array.from({ length: CABIN_COUNT }, (_, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el }}>
          <Cabin color={COLORS[i % COLORS.length]} />
        </group>
      ))}
    </>
  )
}
