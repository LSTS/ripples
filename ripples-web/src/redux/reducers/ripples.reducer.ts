import { createReducer } from '@reduxjs/toolkit'
import IAisShip from '../../model/IAisShip'
import IAsset from '../../model/IAsset'
import { isUserEqual, IUserLocation, noAuth } from '../../model/IAuthState'
import ILatLng from '../../model/ILatLng'
import { DefaultOverlayInfo } from '../../model/IOverlayInfo'
import IPlan, { EmptyPlan, isPlanEqual } from '../../model/IPlan'
import IRipplesState, { defaultAssetsGroup } from '../../model/IRipplesState'
import { ToolSelected } from '../../model/ToolSelected'
import IMission from '../../model/IMission'
import PositionService from '../../services/PositionUtils'
import {
  addAnnotation,
  addMeasurePoint,
  addNewPlan,
  addWpToPlan,
  cancelEditPlan,
  clearMeasure,
  deleteWp,
  editPlan,
  removeGeoLayers,
  removePlan,
  removeUser,
  savePlan,
  deleteSelectedPlan,
  selectVehicle,
  setAis,
  setAnnotations,
  setCcus,
  setEditVehicle,
  setGeoLayers,
  setMapOverlayInfo,
  setPlanDescription,
  setPlans,
  setProfiles,
  setSelectedWaypointIdx,
  setSidePanelContent,
  setSidePanelTitle,
  setSidePanelVisibility,
  setSlider,
  setSpots,
  setToolClickLocation,
  setToolSelected,
  setUser,
  setUpdatingPlanId,
  setVehicles,
  setWeatherParam,
  setEditingPlan,
  setMission,
  toggleGps,
  togglePlanVisibility,
  toggleSliderChange,
  toggleVehicleModal,
  unschedulePlan,
  updateAIS,
  updateCCU,
  updatePlan,
  updatePlanId,
  updateSpot,
  updateUserLocation,
  updateVehicle,
  updateWp,
  updateWpLocation,
  updateWpTimestamp,
  updateMission,
} from '../ripples.actions'

const positionService: PositionService = new PositionService()

const startState: IRipplesState = {
  assets: defaultAssetsGroup,
  auth: noAuth,
  isSidePanelVisible: false,
  planSet: [],
  previousPlanSet: [],
  toggledPlan: null,
  profiles: [],
  selectedPlan: EmptyPlan,
  prevSelectedPlan: null,
  isAnotherSelectedPlan: true,
  selectedWaypointIdx: -1,
  sidePanelContent: {},
  sidePanelTitle: 'Click on something to get info',
  sliderValue: 0,
  toolSelected: ToolSelected.NONE,
  isGpsActive: false,
  vehicleSelected: '',
  measurePath: [],
  annotations: [],
  usersLocations: [],
  isVehicleModalOpen: false,
  hasSliderChanged: false,
  mapOverlayInfo: DefaultOverlayInfo,
  weatherParam: null,
  toolClickLocation: null,
  geoLayers: null,
  isEditingPlan: false,
  updatingPlanId: false,

  missions: [],
}

const ripplesReducer = createReducer(startState, {
  [setUser.type]: (state, action) => {
    state.auth.currentUser = action.payload
    state.auth.authenticated = true
  },
  [removeUser.type]: (state, _) => {
    state.auth = noAuth
  },
  [setVehicles.type]: (state, action) => {
    state.assets.vehicles = action.payload
  },
  [setSpots.type]: (state, action) => {
    state.assets.spots = action.payload
  },
  [setAis.type]: (state, action) => {
    state.assets.aisShips = action.payload
  },
  [setMission.type]: (state, action) => {
    state.missions = action.payload
  },
  [setCcus.type]: (state, action) => {
    state.assets.ccus = action.payload
  },
  [setPlans.type]: (state, action) => {
    state.planSet = action.payload
  },
  [removePlan.type]: (state, action) => {
    const planId = action.payload
    const planIdx = state.planSet.findIndex((p) => p.id === planId)
    state.planSet.splice(planIdx, 1)
  },
  [editPlan.type]: (state, action) => {
    state.selectedPlan = action.payload
    state.previousPlanSet = JSON.parse(JSON.stringify(state.planSet))
    state.isAnotherSelectedPlan = true
  },
  [updateWp.type]: (state, action) => {
    const { planSet, selectedPlan, selectedWaypointIdx } = state
    const plan = planSet.find((p) => isPlanEqual(p, selectedPlan))
    if (!plan) return
    // Update waypoint(s)
    plan.waypoints[selectedWaypointIdx] = action.payload
    if (plan.survey) {
      // If start / finish waypoint changed, set each other equal to one another
      const lastIdx = plan.waypoints.length - 1
      if (selectedWaypointIdx === 0) {
        const timestamp = plan.waypoints[lastIdx].timestamp
        plan.waypoints[lastIdx] = Object.assign(plan.waypoints[lastIdx], plan.waypoints[0], { timestamp })
      } else if (selectedWaypointIdx === lastIdx) {
        const timestamp = plan.waypoints[0].timestamp
        plan.waypoints[0] = Object.assign(plan.waypoints[0], plan.waypoints[lastIdx], { timestamp })
      }
    }
    positionService.updateWaypointsTimestampFromIndex(plan.waypoints, selectedWaypointIdx + 1)
    state.isAnotherSelectedPlan = false
  },
  [updateWpLocation.type]: (state, action) => {
    const newLocation = action.payload
    const plan = state.planSet.find((p) => isPlanEqual(p, state.selectedPlan))
    if (plan) {
      const wp = plan.waypoints[state.selectedWaypointIdx]
      wp.latitude = newLocation.latitude
      wp.longitude = newLocation.longitude
      positionService.updateWaypointsTimestampFromIndex(plan.waypoints, state.selectedWaypointIdx)
      state.selectedPlan = plan
      state.isAnotherSelectedPlan = false
    }
  },
  [updateWpTimestamp.type]: (state, action) => {
    const { timestamp, wpIndex } = action.payload
    const plan = state.planSet.find((p) => isPlanEqual(p, state.selectedPlan))
    if (plan) {
      const wp = plan.waypoints[wpIndex]
      wp.timestamp = timestamp
      positionService.updateWaypointsTimestampFromIndex(plan.waypoints, wpIndex + 1)
      state.selectedPlan = plan
      state.isAnotherSelectedPlan = false
    }
  },
  [deleteWp.type]: (state, action) => {
    const markerIdx = action.payload
    const plan = state.planSet.find((p) => isPlanEqual(p, state.selectedPlan))
    if (!plan) {
      return
    }
    plan.waypoints.splice(markerIdx, 1)
    positionService.updateWaypointsTimestampFromIndex(plan.waypoints, markerIdx)
  },
  [addWpToPlan.type]: (state, action) => {
    const plan = state.planSet.find((p) => isPlanEqual(p, state.selectedPlan))
    if (plan) {
      plan.waypoints.push(action.payload)
      positionService.updateWaypointsTimestampFromIndex(plan.waypoints, plan.waypoints.length - 1)
    }
  },
  [cancelEditPlan.type]: (state, _) => {
    state.planSet = JSON.parse(JSON.stringify(state.previousPlanSet))
    state.previousPlanSet = []
    state.prevSelectedPlan = state.selectedPlan
    state.selectedPlan = EmptyPlan
    state.isEditingPlan = false
    state.isAnotherSelectedPlan = true
    state.isSidePanelVisible = false
  },
  [updatePlanId.type]: (state, action) => {
    const plan = state.planSet.find((p) => isPlanEqual(p, state.selectedPlan))
    if (!plan) {
      return
    }
    state.selectedPlan.id = action.payload
    plan.id = action.payload
    state.isAnotherSelectedPlan = false
  },
  [savePlan.type]: (state, _) => {
    state.previousPlanSet = []
    state.prevSelectedPlan = state.selectedPlan
    state.selectedPlan = EmptyPlan
    state.isAnotherSelectedPlan = true
  },
  [deleteSelectedPlan.type]: (state, _) => {
    const idx = state.planSet.findIndex((p) => isPlanEqual(p, state.selectedPlan))
    state.planSet.splice(idx, 1)
    state.previousPlanSet = []
    state.prevSelectedPlan = EmptyPlan
    state.selectedPlan = EmptyPlan
    state.isAnotherSelectedPlan = true
  },
  [setSlider.type]: (state, action) => {
    state.sliderValue = action.payload
  },
  [setSelectedWaypointIdx.type]: (state, action) => {
    state.selectedWaypointIdx = action.payload
  },
  [setProfiles.type]: (state, action) => {
    state.profiles = action.payload
  },
  [addNewPlan.type]: (state, action) => {
    state.prevSelectedPlan = state.selectedPlan
    state.selectedPlan = action.payload
    state.previousPlanSet = JSON.parse(JSON.stringify(state.planSet))
    state.planSet.push(state.selectedPlan)
    state.isAnotherSelectedPlan = true
  },
  [setToolSelected.type]: (state, action) => {
    state.toolSelected = action.payload
  },
  [selectVehicle.type]: (state, action) => {
    state.vehicleSelected = action.payload
  },
  [setPlanDescription.type]: (state, action) => {
    state.selectedPlan.description = action.payload
    const plan = state.planSet.find((p) => isPlanEqual(p, state.selectedPlan))
    if (plan) {
      plan.description = action.payload
      state.isAnotherSelectedPlan = false
    }
  },
  [setSidePanelTitle.type]: (state, action) => {
    state.sidePanelTitle = action.payload
  },
  [setSidePanelContent.type]: (state, action) => {
    state.sidePanelContent = action.payload
  },
  [setSidePanelVisibility.type]: (state, action) => {
    state.isSidePanelVisible = action.payload
  },
  [unschedulePlan.type]: (state, action) => {
    const plan = state.planSet.find((p) => isPlanEqual(p, state.selectedPlan))
    if (plan) {
      plan.waypoints = plan.waypoints.map((wp) => Object.assign({}, wp, { timestamp: 0 }))
    }
  },
  [togglePlanVisibility.type]: (state, action) => {
    const payloadPlan: IPlan = action.payload
    const plan = state.planSet.find((p) => isPlanEqual(p, payloadPlan))
    if (plan) {
      plan.visible = !plan.visible
      state.toggledPlan = plan
    }
  },
  [updateVehicle.type]: (state, action) => {
    const newAsset: IAsset = action.payload
    const oldAsset = state.assets.vehicles.find((v) => v.imcid === newAsset.imcid)
    if (oldAsset) {
      oldAsset.lastState = newAsset.lastState
      oldAsset.planId = newAsset.planId
      oldAsset.settings = newAsset.settings
    } else {
      state.assets.vehicles.push(newAsset)
    }
  },
  [updateCCU.type]: (state, action) => {
    const newCCU: IAsset = action.payload
    const oldAsset = state.assets.ccus.find((c) => c.name === newCCU.name)
    if (oldAsset) {
      oldAsset.lastState = newCCU.lastState
    } else {
      state.assets.ccus.push(newCCU)
    }
  },
  [updateSpot.type]: (state, action) => {
    const newSpot: IAsset = action.payload
    const oldAsset = state.assets.spots.find((s) => s.name === newSpot.name)
    if (oldAsset) {
      oldAsset.lastState = newSpot.lastState
    } else {
      state.assets.spots.push(newSpot)
    }
  },
  [updatePlan.type]: (state, action) => {
    const newPlan: IPlan = action.payload
    const oldPlan = state.planSet.find((p) => isPlanEqual(p, newPlan))
    if (oldPlan) {
      oldPlan.assignedTo = newPlan.assignedTo
      oldPlan.waypoints = newPlan.waypoints
    } else {
      state.planSet.push(newPlan)
    }
  },
  [updateAIS.type]: (state, action) => {
    const newAIS: IAisShip = action.payload
    const oldAIS = state.assets.aisShips.find((s) => s.mmsi === newAIS.mmsi)
    if (oldAIS) {
      oldAIS.awareness = newAIS.awareness
      oldAIS.dest = newAIS.dest
      oldAIS.eta = newAIS.eta
      oldAIS.heading = newAIS.heading
      oldAIS.latitude = newAIS.latitude
      oldAIS.longitude = newAIS.longitude
      oldAIS.sog = newAIS.sog
      oldAIS.timestamp = newAIS.timestamp
      oldAIS.location = newAIS.location
    } else {
      state.assets.aisShips.push(newAIS)
    }
  },
  [updateMission.type]: (state, action) => {
    const newMission: IMission = action.payload
    const missionExists = state.missions.find((m) => m.path === newMission.path)
    if (typeof missionExists !== 'undefined' || missionExists !== null) {
      state.missions.push(newMission)
    }
  },
  [addMeasurePoint.type]: (state, action) => {
    const newPoint: ILatLng = action.payload
    state.measurePath.push(newPoint)
  },
  [clearMeasure.type]: (state, _) => {
    state.measurePath = []
  },
  [setAnnotations.type]: (state, action) => {
    state.annotations = action.payload
  },
  [addAnnotation.type]: (state, action) => {
    state.annotations.push(action.payload)
  },
  [updateUserLocation.type]: (state, action) => {
    const newLocation: IUserLocation = action.payload
    const oldLocation = state.usersLocations.find((u) => isUserEqual(u, newLocation))
    if (oldLocation) {
      oldLocation.latitude = newLocation.latitude
      oldLocation.longitude = newLocation.longitude
      oldLocation.accuracy = newLocation.accuracy
      oldLocation.timestamp = newLocation.timestamp
    } else if (newLocation.email !== state.auth.currentUser.email) {
      state.usersLocations.push(newLocation)
    }
  },
  [toggleGps.type]: (state, _) => {
    state.isGpsActive = !state.isGpsActive
  },
  [toggleVehicleModal.type]: (state, _) => {
    state.isVehicleModalOpen = !state.isVehicleModalOpen
  },
  [toggleSliderChange.type]: (state, _) => {
    state.hasSliderChanged = !state.hasSliderChanged
  },
  [setEditVehicle.type]: (state, action) => {
    state.editVehicle = action.payload
  },
  [setMapOverlayInfo.type]: (state, action) => {
    const overlayName: string = action.payload
    const isLayerUpdated = overlayName.endsWith('Waves') || overlayName.endsWith('Wind')
    const variable = overlayName.substr(overlayName.indexOf(' '))
    if (overlayName !== '') {
      const overlayInfo = isLayerUpdated
        ? state.sliderValue > 0
          ? `${variable} Forecast`
          : state.sliderValue !== 0
          ? `${variable} Past History`
          : `Current ${variable}`
        : `${variable} Last Received Update`
      state.mapOverlayInfo = {
        name: overlayName,
        info: overlayInfo,
      }
    } else {
      state.mapOverlayInfo = {
        name: '',
        info: '',
      }
    }
  },
  [setWeatherParam.type]: (state, action) => {
    state.weatherParam = action.payload
  },
  [setToolClickLocation.type]: (state, action) => {
    state.toolClickLocation = action.payload
  },
  [setGeoLayers.type]: (state, action) => {
    state.geoLayers = action.payload
  },
  [removeGeoLayers.type]: (state, _) => {
    state.geoLayers = []
  },
  [setEditingPlan.type]: (state, action) => {
    state.isEditingPlan = action.payload
  },
  [setUpdatingPlanId.type]: (state, action) => {
    state.updatingPlanId = action.payload
  },
})

export default ripplesReducer
