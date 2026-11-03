import { useRideStore } from '../store/useRideStore'
import { useTicketStore } from '../store/useTicketStore'
import { resetStats } from '../lib/tickets'
import { CURRENCY } from '../lib/config'

const clock = (h: number) => {
  const hh = Math.floor(h) % 24
  const mm = Math.round((h - Math.floor(h)) * 60) % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export function Hud() {
  const speed = useRideStore((s) => s.speed)
  const riding = useRideStore((s) => s.riding)
  const hour = useRideStore((s) => Math.round(s.hour * 4) / 4)
  const autoTime = useRideStore((s) => s.autoTime)
  const sound = useRideStore((s) => s.sound)
  const volume = useRideStore((s) => s.volume)
  const setSpeed = useRideStore((s) => s.setSpeed)
  const toggleRide = useRideStore((s) => s.toggleRide)
  const setHour = useRideStore((s) => s.setHour)
  const setAutoTime = useRideStore((s) => s.setAutoTime)
  const setSound = useRideStore((s) => s.setSound)
  const setVolume = useRideStore((s) => s.setVolume)

  const price = useTicketStore((s) => s.price)
  const capacity = useTicketStore((s) => s.capacity)
  const stats = useTicketStore((s) => s.stats)
  const setPrice = useTicketStore((s) => s.setPrice)
  const setCapacity = useTicketStore((s) => s.setCapacity)

  return (
    <>
      <div className="hud">
        <h1>Cableverse 3D</h1>
        <button onClick={toggleRide}>{riding ? 'Leave cabin' : 'Ride a cabin'}</button>
        <label>
          Simulation speed: {speed.toFixed(1)}×
          <input
            type="range" min={0} max={2.5} step={0.1} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
        </label>
        <label>
          Time of day: {clock(hour)}
          <input
            type="range" min={0} max={24} step={0.25} value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
          />
        </label>
        <label className="check">
          <input type="checkbox" checked={autoTime} onChange={(e) => setAutoTime(e.target.checked)} />
          Run the day automatically
        </label>
        <button className="secondary" onClick={() => setSound(!sound)} aria-pressed={sound}>
          {sound ? '🔊 Sound on' : '🔇 Sound off'}
        </button>
        {sound && (
          <label>
            Volume
            <input
              type="range" min={0} max={1} step={0.05} value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </label>
        )}
        <p>{riding ? 'Drag to look around.' : 'Drag to orbit, scroll to zoom.'}</p>
      </div>

      <div className="hud right">
        <h2>Ticket office</h2>
        <label>
          Ticket price: {CURRENCY}{price}
          <input
            type="range" min={0} max={20} step={1} value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </label>
        <label>
          Cabin capacity: {capacity} {capacity === 1 ? 'seat' : 'seats'}
          <input
            type="range" min={1} max={5} step={1} value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
        </label>
        <dl className="stats">
          <dt>Waiting at summit</dt><dd>{stats.queue[0]}</dd>
          <dt>Waiting at valley</dt><dd>{stats.queue[1]}</dd>
          <dt>Tickets sold</dt><dd>{stats.sold}</dd>
          <dt>Revenue</dt><dd>{CURRENCY}{stats.revenue}</dd>
          <dt>Average load</dt><dd>{Math.round(stats.load * 100)}%</dd>
          <dt>Turned away</dt><dd>{stats.turnedAway}</dd>
        </dl>
        <button className="secondary" onClick={resetStats}>Reset counters</button>
      </div>
    </>
  )
}
