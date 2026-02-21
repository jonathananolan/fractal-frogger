export function getStartingXFromId(id: string, gridSize: number): number {
  return id.charCodeAt(0) % gridSize;
}
