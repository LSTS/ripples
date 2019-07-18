import IAisShip, { IShipLocation } from './IAisShip'
import IAsset from './IAsset'
import IUserState from './IAuthState'
import IPlan from './IPlan'
import IProfile from './IProfile'
import { ToolSelected } from './ToolSelected'

export interface IAssetsGroup {
  vehicles: IAsset[]
  spots: IAsset[]
  aisShips: IAisShip[]
  aisDrawableLocations: IShipLocation[]
  ccus: IAsset[]
}

export default interface IRipplesState {
  assets: IAssetsGroup
  selectedPlan: IPlan // plan id
  sliderValue: number
  selectedWaypointIdx: number
  auth: IUserState
  profiles: IProfile[]
  planSet: IPlan[]
  previousPlanSet: IPlan[]
  toolSelected: ToolSelected
  vehicleSelected: string
  sidePanelTitle: string
  sidePanelContent: any
  isSidePanelVisible: boolean
}

export const defaultAssetsGroup: IAssetsGroup = {
  aisDrawableLocations: [],
  aisShips: [],
  spots: [],
  vehicles: [],
  ccus: [],
}
