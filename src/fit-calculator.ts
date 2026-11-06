export type FitLevel = 'works' | 'tight' | 'replan'

export type FitInputs = {
  roomWidth: number
  roomLength: number
  bedWidth: number
  bedLength: number
  deskDepth: number
  dresserDepth: number
}

export type FitResult = {
  clearanceA: number
  clearanceB: number
  bestClearance: number
  bestOrientation: 'A' | 'B'
  level: FitLevel
}

export function calculateFurnitureFit(input: FitInputs): FitResult {
  // This is deliberately a screening calculation. The optional dresser is
  // treated as part of the opposite furniture zone, capped at 18 inches so
  // the result prompts a real-room tape test instead of claiming precision.
  const oppositeZoneDepth = input.deskDepth + (input.dresserDepth ? Math.min(input.dresserDepth, 18) : 0)
  const clearanceA = Math.min(input.roomWidth - input.bedWidth - oppositeZoneDepth, input.roomLength - input.bedLength)
  const clearanceB = Math.min(input.roomLength - input.bedWidth - oppositeZoneDepth, input.roomWidth - input.bedLength)
  const bestClearance = Math.max(clearanceA, clearanceB)
  const bestOrientation = clearanceA >= clearanceB ? 'A' : 'B'
  const level: FitLevel = bestClearance >= 30 ? 'works' : bestClearance >= 24 ? 'tight' : 'replan'
  return { clearanceA, clearanceB, bestClearance, bestOrientation, level }
}
