import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Sky, Stars } from '@react-three/drei'
import { SunsetGlow } from './SunsetGlow'
import { useRideStore } from '../store/useRideStore'
import { env } from '../lib/env'
import { glassMat, lampMat } from '../lib/materials'
import { smoothstep } from '../lib/math'

const DAY_SECONDS = 150 // real seconds for a full 24h cycle when auto time is on

const col = (c: string) => new THREE.Color(c)
const WHITE = col('#ffffff')
const WARM = col('#ff9a55')
const MOON = col('#a9bbe6')
const SKY_DAY = col('#dbe9f6')
const SKY_NIGHT = col('#26365e')
const SKY_DUSK = col('#ffb48a')
const GROUND_DAY = col('#5b5a52')
const GROUND_NIGHT = col('#0c0e12')
const GLASS_DAY = col('#d6ecf8')
const GLASS_NIGHT = col('#05080e')
const FOG_DAY = col('#cfe0ee')
const FOG_NIGHT = col('#070b14')
const FOG_DUSK = col('#d79a78')

const sunAngle = (hour: number) => ((hour - 6) / 12) * Math.PI

export function Lighting() {
  const sun = useRef<THREE.DirectionalLight>(null)
  const moon = useRef<THREE.DirectionalLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const fog = useRef<THREE.Fog>(null)
  const dome = useRef<THREE.MeshBasicMaterial>(null)

  // Quantised so the sky only re-renders a few times per second.
  const hourQ = useRideStore((s) => Math.round(s.hour * 10) / 10)
  const sunPos = useMemo<[number, number, number]>(() => {
    const a = sunAngle(hourQ)
    // Keep the sky's sun just above the horizon through twilight so it keeps its glow;
    // the night dome fades the sky out instead.
    return [-Math.cos(a) * 100, Math.max(Math.sin(a) * 100, 3), -35]
  }, [hourQ])
  const elevQ = Math.sin(sunAngle(hourQ))
  const showStars = elevQ < -0.05
  const dayQ = smoothstep(-0.25, 0.35, elevQ)

  useFrame((_, delta) => {
    const st = useRideStore.getState()
    let hour = st.hour
    if (st.autoTime) {
      hour = (hour + (Math.min(delta, 0.1) * 24) / DAY_SECONDS) % 24
      st.setHour(hour)
    }
    const a = sunAngle(hour)
    const elev = Math.sin(a)
    const day = smoothstep(-0.25, 0.35, elev)
    const night = 1 - day
    const dusk = Math.max(0, 1 - Math.abs(elev) / 0.35)
    env.night = night
    env.dusk = dusk
    env.sun = [-Math.cos(a) * 100, Math.sin(a) * 100, -35]
    env.daylight = day

    if (sun.current) {
      sun.current.position.set(-Math.cos(a) * 100, Math.sin(a) * 100, -35)
      sun.current.intensity = 2.0 * day
      sun.current.color.copy(WHITE).lerp(WARM, dusk * 0.8)
    }
    if (moon.current) {
      moon.current.position.set(Math.cos(a) * 100, -Math.sin(a) * 100, 35)
      moon.current.intensity = 0.4 * night
      moon.current.color.copy(MOON)
    }
    if (hemi.current) {
      hemi.current.intensity = 0.2 + 0.5 * day
      hemi.current.color.copy(SKY_NIGHT).lerp(SKY_DAY, day).lerp(SKY_DUSK, dusk * 0.4)
      hemi.current.groundColor.copy(GROUND_NIGHT).lerp(GROUND_DAY, day)
    }
    if (fog.current) {
      fog.current.color.copy(FOG_NIGHT).lerp(FOG_DAY, day).lerp(FOG_DUSK, dusk * 0.5)
    }
    if (dome.current) dome.current.opacity = Math.min(1, night * 1.06)
    glassMat.color.copy(GLASS_NIGHT).lerp(GLASS_DAY, day)
    lampMat.emissiveIntensity = 0.1 + 2.6 * night
  })

  return (
    <>
      <fog ref={fog} attach="fog" args={['#cfe0ee', 90, 320]} />
      {/* The sky shader never gets truly dark, so a dome fades in over it at night. */}
      <mesh renderOrder={-1}>
        <sphereGeometry args={[450, 24, 16]} />
        <meshBasicMaterial ref={dome} color="#04070f" side={THREE.BackSide} transparent opacity={0} depthWrite={false} fog={false} />
      </mesh>
      <SunsetGlow />
      <Sky sunPosition={sunPos} turbidity={6} rayleigh={0.02 + 1.2 * dayQ} mieCoefficient={0.0005 + 0.004 * dayQ} />
      {showStars && <Stars radius={400} depth={60} count={3500} factor={7} fade speed={0} />}
      <hemisphereLight ref={hemi} args={['#dbe9f6', '#5b5a52', 0.7]} />
      <directionalLight ref={sun} position={[-20, 80, -35]} intensity={1.8} />
      <directionalLight ref={moon} position={[20, -80, 35]} intensity={0} />
    </>
  )
}
