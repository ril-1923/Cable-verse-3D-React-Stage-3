import { useMemo } from 'react'
import type { RefObject } from 'react'
import * as THREE from 'three'
import { CABIN_H, CABIN_L, CABIN_W, FLOOR_TOP, HANG, ROOF_T } from '../lib/cableway'
import { chromeMat, floorMat, glassMat, lampMat, metalMat, seatMat } from '../lib/materials'

interface Props {
  color: string
  doorRef: RefObject<THREE.Group | null>
  lightRef: RefObject<THREE.PointLight | null>
}

const LOW = 0.8 // solid lower wall band
const DOOR_W = 1.2

/** Origin is the rope grip point; the cabin hangs below it. The door is on the local -z side. */
export function CabinModel({ color, doorRef, lightRef }: Props) {
  const body = useMemo(
    () => new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.15 }),
    [color],
  )
  const L = CABIN_L
  const W = CABIN_W
  const H = CABIN_H
  const fy = FLOOR_TOP
  const glassH = H - LOW
  const yLow = fy + LOW / 2
  const yGlass = fy + LOW + glassH / 2
  const secW = L / 2 - DOOR_W / 2
  const secX = (L / 2 + DOOR_W / 2) / 2

  const post: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]]

  return (
    <>
      {/* hanger arm and grip */}
      <mesh position={[0, -HANG / 2, 0]} material={metalMat}>
        <cylinderGeometry args={[0.05, 0.05, HANG, 8]} />
      </mesh>
      <mesh position={[0, -0.15, 0]} material={metalMat}>
        <boxGeometry args={[0.6, 0.3, 0.4]} />
      </mesh>

      {/* roof and floor */}
      <mesh position={[0, -HANG - ROOF_T / 2, 0]} material={body}>
        <boxGeometry args={[L + 0.3, ROOF_T, W + 0.3]} />
      </mesh>
      <mesh position={[0, fy - 0.1, 0]} material={body}>
        <boxGeometry args={[L + 0.3, 0.2, W + 0.3]} />
      </mesh>
      <mesh position={[0, fy + 0.005, 0]} material={floorMat}>
        <boxGeometry args={[L - 0.1, 0.01, W - 0.1]} />
      </mesh>

      {/* corner posts */}
      {post.map(([sx, sz]) => (
        <mesh key={`${sx}${sz}`} position={[sx * L / 2, fy + H / 2, sz * W / 2]} material={body}>
          <boxGeometry args={[0.1, H, 0.1]} />
        </mesh>
      ))}

      {/* end walls and back wall: solid band + glass */}
      {[-1, 1].map((sx) => (
        <group key={`end${sx}`} position={[sx * L / 2, 0, 0]}>
          <mesh position={[0, yLow, 0]} material={body}><boxGeometry args={[0.06, LOW, W]} /></mesh>
          <mesh position={[0, yGlass, 0]} material={glassMat}><boxGeometry args={[0.04, glassH, W]} /></mesh>
        </group>
      ))}
      <group position={[0, 0, W / 2]}>
        <mesh position={[0, yLow, 0]} material={body}><boxGeometry args={[L, LOW, 0.06]} /></mesh>
        <mesh position={[0, yGlass, 0]} material={glassMat}><boxGeometry args={[L, glassH, 0.04]} /></mesh>
      </group>

      {/* door side: two fixed sections around the opening */}
      {[-1, 1].map((sx) => (
        <group key={`door${sx}`} position={[sx * secX, 0, -W / 2]}>
          <mesh position={[0, yLow, 0]} material={body}><boxGeometry args={[secW, LOW, 0.06]} /></mesh>
          <mesh position={[0, yGlass, 0]} material={glassMat}><boxGeometry args={[secW, glassH, 0.04]} /></mesh>
        </group>
      ))}

      {/* sliding door, runs on the outside of the right-hand section */}
      <group ref={doorRef} position={[0, 0, -W / 2 - 0.05]}>
        <mesh position={[0, yLow, 0]} material={body}><boxGeometry args={[DOOR_W, LOW, 0.05]} /></mesh>
        <mesh position={[0, yGlass, 0]} material={glassMat}><boxGeometry args={[DOOR_W, glassH, 0.05]} /></mesh>
      </group>

      {/* benches on the end walls */}
      {[-1, 1].map((sx) => (
        <group key={`bench${sx}`}>
          <mesh position={[sx * 1.45, fy + 0.45, 0]} material={seatMat}>
            <boxGeometry args={[0.45, 0.1, 1.9]} />
          </mesh>
          <mesh position={[sx * 1.64, fy + 0.75, 0]} material={seatMat}>
            <boxGeometry args={[0.08, 0.55, 1.9]} />
          </mesh>
          <mesh position={[sx * 1.45, fy + 0.2, 0]} material={metalMat}>
            <boxGeometry args={[0.4, 0.4, 1.8]} />
          </mesh>
        </group>
      ))}

      {/* grab pole and roof lamp */}
      <mesh position={[0.8, fy + H / 2, -0.8]} material={chromeMat}>
        <cylinderGeometry args={[0.025, 0.025, H, 8]} />
      </mesh>
      <mesh position={[0, fy + H - 0.03, 0]} material={lampMat}>
        <boxGeometry args={[0.9, 0.04, 0.5]} />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, fy + H - 0.4, 0]}
        color="#ffe6b8"
        intensity={0}
        distance={7}
        decay={2}
      />
    </>
  )
}
