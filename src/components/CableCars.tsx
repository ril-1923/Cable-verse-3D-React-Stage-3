import { createRef, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { CABIN_COUNT, FLOOR_TOP, cableY, pathAt } from '../lib/cableway'
import { PERIOD, V0, cabinState, doorOpen } from '../lib/schedule'
import { MAX_PAX, newPose, passengerPose } from '../lib/passengers'
import { createPerson, dressPerson, posePerson } from '../lib/person'
import { hash, wrapAngle } from '../lib/math'
import { audio } from '../lib/audio'
import { pushStats, stepDemand } from '../lib/tickets'
import { env } from '../lib/env'
import { useRideStore } from '../store/useRideStore'
import { CabinModel } from './CabinModel'

const COLORS = ['#e8b33a', '#d9483b', '#3b8fd9', '#4fb37a']
const EYE = new THREE.Vector3(0.2, FLOOR_TOP + 1.55, 0) // seated-height view from cabin 0
const UP = new THREE.Vector3(0, 1, 0)

interface LookControls { target: THREE.Vector3; update: () => void }

export function CableCars() {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as unknown as LookControls | null

  const phase = useRef(0)
  const pitch = useRef<number[]>(Array(CABIN_COUNT).fill(0))
  const ride = useRef({ active: false, prev: new THREE.Vector3(), yaw: 0 })
  const lastStation = useRef<(number | undefined)[]>(Array(CABIN_COUNT).fill(undefined))
  const statsTimer = useRef(0)

  const cabins = useMemo(
    () => Array.from({ length: CABIN_COUNT }, () => ({
      group: createRef<THREE.Group>(),
      door: createRef<THREE.Group>(),
      light: createRef<THREE.PointLight>(),
    })),
    [],
  )
  const persons = useMemo(
    () => Array.from({ length: CABIN_COUNT * 2 * MAX_PAX }, () => createPerson()),
    [],
  )
  const tmp = useMemo(() => ({ v: new THREE.Vector3(), eye: new THREE.Vector3(), pose: newPose() }), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const { speed, riding } = useRideStore.getState()
    phase.current += dt * speed
    const time = state.clock.elapsedTime

    stepDemand(dt * speed)
    statsTimer.current += dt
    if (statsTimer.current > 0.25) {
      statsTimer.current = 0
      pushStats()
    }
    let moving = 0

    // --- cabins ---
    cabins.forEach((c, i) => {
      const g = c.group.current
      if (!g) return
      const T = phase.current + (i * PERIOD) / CABIN_COUNT
      const cs = cabinState(T % PERIOD)
      moving += cs.v / V0
      const before = lastStation.current[i]
      if (before !== undefined && speed > 0) {
        if (cs.station >= 0 && before < 0) audio.chime('arrive')
        else if (cs.station < 0 && before >= 0) audio.chime('depart')
      }
      lastStation.current[i] = cs.station
      const p = pathAt(cs.s)
      g.rotation.order = 'YXZ'
      g.position.set(p.x, cableY(p.x), p.z)
      g.rotation.y = Math.atan2(-p.dz, p.dx)

      // Pendulum: lags behind when speeding up, swings forward when braking.
      const targetPitch = -cs.a * speed * 0.05
      pitch.current[i] += (targetPitch - pitch.current[i]) * Math.min(1, dt * 2.5)
      g.rotation.z = pitch.current[i]
      g.rotation.x = Math.sin(time * 1.1 + i * 2) * 0.025 * Math.min(1, cs.v / V0)
      g.updateMatrixWorld()

      if (c.door.current) c.door.current.position.x = doorOpen(cs) * 1.15
      if (c.light.current) c.light.current.intensity = env.night * 4
    })

    env.rope = (moving / CABIN_COUNT) * Math.min(speed, 1.5)

    // --- passengers ---
    const { v, pose } = tmp
    for (let i = 0; i < CABIN_COUNT; i++) {
      const g = cabins[i].group.current
      if (!g) continue
      const T = phase.current + (i * PERIOD) / CABIN_COUNT
      for (let slot = 0; slot < 2; slot++) {
        for (let j = 0; j < MAX_PAX; j++) {
          const person = persons[(i * 2 + slot) * MAX_PAX + j]
          passengerPose(i, slot as 0 | 1, j, T, pose)
          if (!pose.visible) {
            person.visible = false
            continue
          }
          if (person.userData.leg !== pose.leg) {
            person.userData.leg = pose.leg
            person.userData.yaw = undefined
            dressPerson(person, hash(pose.leg * 8 + j, i + 1))
          }
          v.set(pose.x, pose.y + 0.1 * pose.seat, pose.z)
          let yaw = pose.yaw
          if (pose.inCabin) {
            g.localToWorld(v)
            yaw += g.rotation.y
          }
          person.position.copy(v)
          const prev: number = person.userData.yaw ?? yaw
          person.userData.yaw = prev + wrapAngle(yaw - prev) * Math.min(1, dt * 10)
          person.rotation.y = person.userData.yaw
          person.scale.setScalar(Math.max(pose.scale, 0.001))
          posePerson(person, pose.seat, pose.swing, pose.stride)
          person.visible = true
        }
      }
    }

    // --- ride camera: sits in cabin 0, drag to look around ---
    const g0 = cabins[0].group.current
    const r = ride.current
    if (riding && g0 && controls) {
      const eye = g0.localToWorld(tmp.eye.copy(EYE))
      const yaw = g0.rotation.y
      if (!r.active) {
        // start by looking out of the side window (local +z), clear of the end benches
        camera.position.set(eye.x - Math.sin(yaw) * 0.25, eye.y, eye.z - Math.cos(yaw) * 0.25)
        controls.target.copy(eye)
        r.active = true
      } else {
        const dx = eye.x - r.prev.x
        const dy = eye.y - r.prev.y
        const dz = eye.z - r.prev.z
        camera.position.x += dx
        camera.position.y += dy
        camera.position.z += dz
        controls.target.copy(eye)
        // keep the view turning with the cabin around the station turnarounds
        const off = tmp.v.copy(camera.position).sub(eye)
        off.applyAxisAngle(UP, wrapAngle(yaw - r.yaw))
        camera.position.copy(eye).add(off)
      }
      r.prev.copy(eye)
      r.yaw = yaw
      controls.update()
    } else {
      r.active = false
    }
  })

  return (
    <>
      {cabins.map((c, i) => (
        <group key={i} ref={c.group}>
          <CabinModel color={COLORS[i % COLORS.length]} doorRef={c.door} lightRef={c.light} />
        </group>
      ))}
      {persons.map((p, i) => (
        <primitive key={i} object={p} />
      ))}
    </>
  )
}
