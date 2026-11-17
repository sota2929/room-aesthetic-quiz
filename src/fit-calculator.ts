export type FitLevel = 'works' | 'tight' | 'replan'

export type FitInputs = {
  roomWidth: number
  roomLength: number
  bedWidth: number
  bedLength: number
  deskWidth: number
  deskDepth: number
  dresserDepth: number
  doorReserve?: number
  closetReserve?: number
  chairReserve?: number
}

export type FitResult = {
  clearanceA: number
  clearanceB: number
  bestClearance: number
  bestOrientation: 'A' | 'B'
  level: FitLevel
  maxDeskDepthA: number
  maxDeskDepthB: number
  deskWallFitsA: boolean
  deskWallFitsB: boolean
  constraintReserve: number
}

export function calculateFurnitureFit(input: FitInputs): FitResult {
  // This is deliberately a screening calculation. The optional dresser is
  // treated as part of the opposite furniture zone, capped at 18 inches so
  // the result prompts a real-room tape test instead of claiming precision.
  const oppositeZoneDepth = Math.max(input.deskDepth, input.dresserDepth || 0)
  // The tool does not know where a door, closet, or chair sits. Treating those
  // unknown positions as a subtraction from one wall creates false precision.
  // They are preserved as tape-test constraints, while the geometry below
  // screens only the finished furniture footprints.
  const constraintReserve = Math.max(input.doorReserve || 0, input.closetReserve || 0, input.chairReserve || 0)
  const clearanceA = Math.min(
    input.roomWidth - input.bedWidth - oppositeZoneDepth,
    input.roomLength - input.bedLength,
  )
  const clearanceB = Math.min(
    input.roomLength - input.bedWidth - oppositeZoneDepth,
    input.roomWidth - input.bedLength,
  )
  const bestClearance = Math.max(clearanceA, clearanceB)
  const bestOrientation = clearanceA >= clearanceB ? 'A' : 'B'
  const level: FitLevel = bestClearance >= 30 ? 'works' : bestClearance >= 24 ? 'tight' : 'replan'
  const maxDeskDepthA = Math.max(0, input.roomWidth - input.bedWidth - 30)
  const maxDeskDepthB = Math.max(0, input.roomLength - input.bedWidth - 30)
  const deskWallFitsA = input.deskWidth <= input.roomLength
  const deskWallFitsB = input.deskWidth <= input.roomWidth
  return {
    clearanceA,
    clearanceB,
    bestClearance,
    bestOrientation,
    level,
    maxDeskDepthA,
    maxDeskDepthB,
    deskWallFitsA,
    deskWallFitsB,
    constraintReserve,
  }
}
