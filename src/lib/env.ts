/** Shared state written once per frame and read by lamps, sound and visuals. */
export const env = {
  night: 0,
  daylight: 1,
  dusk: 0, // 1 at sunrise/sunset, 0 in full day or night
  sun: [0, 1, 0] as [number, number, number],
  rope: 0, // average cabin speed 0..1, scaled by simulation speed
}
