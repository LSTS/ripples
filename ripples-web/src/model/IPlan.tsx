import IPositionAtTime from './IPositionAtTime'

export default interface IPlan {
  id: string
  waypoints: IPositionAtTime[]
  assignedTo: string // asset name
  description: string
  visible: boolean
}

export const EmptyPlan: IPlan = {
  assignedTo: '',
  description: '',
  id: '',
  waypoints: [],
  visible: false,
}
