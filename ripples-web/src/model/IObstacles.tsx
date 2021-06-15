export default interface IObstacle {
  id: number
  description: string
  positions: number[][]
  timestamp: number
  user: string
}

export default class IObstacle implements IObstacle {
  constructor(
    public description: string,
    public positions: number[][],
    public timestamp: number,
    public user: string
  ) {}
}
