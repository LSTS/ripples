export default interface IMission {
  mission: string
  date: Date
  location: string
  plan: string
  vehicle: string
  path: string
  boundingBox: {
    minX: number
    minY: number
    maxX: number
    maxY: number
  }
}
