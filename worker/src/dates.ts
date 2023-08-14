export function getCurrentTimestampSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

export function getCurrentTimestampMilliseconds(): number {
  return Math.floor(Date.now())
}
