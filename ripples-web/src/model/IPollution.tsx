export default interface IPollution {
  id: number
  description: string
  radius: number
  latitude: number
  longitude: number
  timestamp: number
  status: string
  user: string
}

export default class IPollution implements IPollution {
  constructor(
    public description: string,
    public radius: number,
    public latitude: number,
    public longitude: number,
    public timestamp: number,
    public status: string,
    public user: string
  ) {}
}
