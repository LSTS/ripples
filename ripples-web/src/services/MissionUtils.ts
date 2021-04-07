import IMission from '../model/IMission'
import L, { LatLngBounds } from 'leaflet'

export default class MissionService {
  public async fetchMissionData(): Promise<IMission[]> {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/missions`)
    const missions = await response.json()
    // ships = ships.map((s: IMission) => this.convertAISToRipples(s))
    // return ships.filter((s: IAisShip) => this.isRecent(s))
    return missions
  }

  public isMissionBetweenDate(mission: IMission, startDate: any, endDate: any): boolean {
    const missionDate = new Date(mission.date).getTime()
    if (missionDate >= startDate && missionDate <= endDate) {
      return true
    } else {
      return false
    }
  }

  public isMissionInMapBounds(mission: IMission, mapBounds: LatLngBounds): boolean {
    const SW = new L.LatLng(mission.boundingBox.minY, mission.boundingBox.minX)
    const NE = new L.LatLng(mission.boundingBox.maxY, mission.boundingBox.maxX)
    const imgBounds = L.latLngBounds(SW, NE)
    const center = imgBounds.getCenter()

    return mapBounds.contains([center.lat, center.lng])
  }
}
