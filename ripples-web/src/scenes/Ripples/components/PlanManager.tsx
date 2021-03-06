import React, { Component } from 'react'
import { FeatureGroup, Marker } from 'react-leaflet'
// @ts-ignore
import { EditControl } from 'react-leaflet-draw'
import { WaypointIcon, StartWaypointIcon, FinishWaypointIcon } from './Icons'
import L, { Layer, LatLng } from 'leaflet'
// @ts-ignore
import 'leaflet-draw'
import DateService from '../../../services/DateUtils'
import IPositionAtTime, { ILatLngAtTime, ILatLngs, IVehicleAtTime } from '../../../model/IPositionAtTime'
import { connect } from 'react-redux'
import IAsset from '../../../model/IAsset'
import {
  addNewPlan,
  removePlan,
  setEditVehicle,
  setSelectedWaypointIdx,
  setSidePanelTitle,
  setSidePanelContent,
  setSidePanelVisibility,
  updatePlan,
  updateWp,
  updateWpLocation,
  updateWpTimestamp,
} from '../../../redux/ripples.actions'
import IPlan, { EmptyPlan } from '../../../model/IPlan'
import PositionService from '../../../services/PositionUtils'
import IRipplesState from '../../../model/IRipplesState'
import { IUser } from '../../../model/IAuthState'
import SoiService from '../../../services/SoiUtils'
import { ToolSelected } from '../../../model/ToolSelected'
import ILatLng from '../../../model/ILatLng'
import WaypointPopup from './WaypointPopup'
const { NotificationManager } = require('react-notifications')

interface PropsType {
  mapRef: any
  currentUser: IUser
  plans: IPlan[]
  selectedPlan: IPlan
  prevSelectedPlan: IPlan | null
  isAnotherSelectedPlan: boolean
  toolSelected: ToolSelected
  isEditingPlan: boolean
  selectedWaypointIdx: number
  toggledPlan: IPlan | null
  updatingPlanId: boolean
  addNewPlan: (plan: IPlan) => void
  removePlan: (planId: string) => void
  setSidePanelTitle: (title: string) => void
  setSidePanelContent: (content: any) => void
  setSidePanelVisibility: (v: boolean) => void
  setEditVehicle: (v: IAsset | undefined) => void
  setSelectedWaypointIdx: (_: number) => void
  updatePlan: (plan: IPlan) => void
  updateWp: (wp: IPositionAtTime) => void
  updateWpLocation: (_: ILatLng) => void
  updateWpTimestamp: (_: any) => void
}

interface StateType {
  collection: any
  currentPlanId: string
  onEditMode: boolean
  loadedPlans: boolean
  invisibleLayers: any[]
}

interface PlanProperties {
  length: number
  area: number
}

/**
 * Polygon editor template snippet
 * adapted from https://github.com/alex3165/react-leaflet-draw
 */
class PlanManager extends Component<PropsType, StateType> {
  private posService: PositionService = new PositionService()
  private soiService: SoiService = new SoiService()
  private planProperties = new Map<string, PlanProperties>()
  private _editableFG = null

  public constructor(props: any) {
    super(props)
    this.state = {
      collection: null,
      currentPlanId: '',
      onEditMode: false,
      loadedPlans: false,
      invisibleLayers: [],
    }
    this.updateWaypoint = this.updateWaypoint.bind(this)
  }

  static polygonOptions = {
    icon: new WaypointIcon(),
    allowIntersection: false,
    showArea: true,
    showLength: true,
    showRadius: true,
    metric: ['km', 'm'],
    shapeOptions: {
      stroke: true,
      color: '#000080',
      weight: 4,
      opacity: 1,
      fill: false,
      clickable: false,
    },
  }

  componentDidUpdate(prevProps: PropsType) {
    const {
      plans,
      isEditingPlan,
      selectedPlan,
      prevSelectedPlan,
      toggledPlan,
      isAnotherSelectedPlan,
      updatingPlanId,
    } = this.props

    const { loadedPlans } = this.state

    // Change of plan set
    if (prevProps.plans !== plans) {
      if (!loadedPlans) {
        // Initial loading of plan layers
        this.loadInitialPlans(plans)
      } else if (!updatingPlanId) {
        // Update of received plans
        this.updatePlans(prevProps.plans, plans)
      } else if (!isEditingPlan && prevSelectedPlan) {
        this.resetPlanLayer(prevSelectedPlan)
      }
    }
    // Changes of the selected plan
    if (prevProps.selectedPlan !== selectedPlan) {
      if (isAnotherSelectedPlan) {
        this.changeLayerColor(selectedPlan)
        this.togglePlanSidePanel(selectedPlan)
      } else if (updatingPlanId) {
        this.updateLayerId(prevProps.selectedPlan.id, selectedPlan.id)
      } else {
        this.updatePlanProperties(selectedPlan)
      }
    }
    // Change of plan visibility
    if (prevProps.toggledPlan !== toggledPlan) {
      this.updateLayerVisibility(toggledPlan)
    }
  }

  resetPlanLayer(plan: IPlan) {
    const { getLatLngFromArray } = this.posService

    if (!plan) return

    // @ts-ignore
    const layer: any = this.getLayerById(plan.id)
    if (!layer) return

    // Reset path coordinates
    const waypoints = getLatLngFromArray(plan.waypoints)
    if (plan.survey) {
      layer._latlngs[0] = waypoints
    } else {
      layer._latlngs = waypoints
    }

    // Reset plan properties
    this.updatePlanProperties(plan)
  }

  togglePlanSidePanel(plan: IPlan) {
    const properties = this.planProperties.get(plan.id)
    if (!properties) return

    // @ts-ignore
    const length = L.GeometryUtil.readableDistance(properties.length, true, false, false, 2)
    // @ts-ignore
    const area = L.GeometryUtil.readableArea(properties.area, ['km'], 2)
    const content = {
      'Length (km)': length,
      ...(properties.area > 0 && { 'Area (km²)': area }),
    }

    this.props.setSidePanelTitle(plan.id)
    this.props.setSidePanelContent(content)
    this.props.setSidePanelVisibility(true)
  }

  insertPlanLayers(newPlans: IPlan[]) {
    newPlans.forEach((p) => {
      const { shapeOptions } = PlanManager.polygonOptions
      const wps = this.posService.getLatLngFromArray(p.waypoints)

      const layer: any = p.survey ? new L.Polygon(wps) : new L.Polyline(wps)
      // Override layer drawing properties
      layer.options.id = p.id
      layer.options.color = shapeOptions.color

      // Save geodesic area and length
      this.savePlanProperties(p.id, wps, p.survey)

      // @ts-ignore
      this._editableFG.leafletElement.addLayer(layer)

      // Show plan properties
      this.bindPopupToPlan(layer, p.id)
    })
  }

  deletePlanLayers(deletedPlans: IPlan[]) {
    deletedPlans.forEach((p) => {
      const layer = this.getLayerById(p.id)
      if (!layer) return
      // @ts-ignore
      this._editableFG.leafletElement.removeLayer(layer)
    })
  }

  updatePlans(prevPlans: IPlan[], plans: IPlan[]) {
    const { selectedPlan } = this.props
    // Insert plan layers (if the plan is being created, it is selected, so it did not come from SOI)
    const newPlans = plans.filter((p1) => !prevPlans.some((p2) => p1.id === p2.id) && p1.id !== selectedPlan.id)
    if (newPlans.length > 0) {
      this.insertPlanLayers(newPlans)
    }
    // Delete plan layers
    const deletedPlans = prevPlans.filter((p1) => !plans.some((p2) => p1.id === p2.id))
    if (deletedPlans.length > 0) {
      this.deletePlanLayers(deletedPlans)
    }
  }

  updatePlanProperties(plan: IPlan) {
    const latlngs = this.posService.getLatLngFromArray(plan.waypoints)
    this.savePlanProperties(plan.id, latlngs, plan.survey)
  }

  updateLayerId(prevId: string, newId: string) {
    const layer: any = this.getLayerById(prevId)
    if (!layer) return
    // Update layer id
    layer.options.id = newId
    // Update plan properties
    const prevProperties = this.planProperties.get(prevId)
    if (prevProperties) {
      this.planProperties.set(newId, prevProperties)
      this.planProperties.delete(prevId)
    }
    // Update layer popup
    const content = this.buildPlanPopupContent(newId)
    layer.getPopup().setContent(content)
  }

  updateLayerVisibility(toggledPlan: IPlan | null) {
    if (!toggledPlan) return

    const { invisibleLayers } = this.state

    if (!toggledPlan.visible) {
      const layer = this.getLayerById(toggledPlan.id)
      // Store invisible layer
      invisibleLayers.push(layer)
      // @ts-ignore, remove the layer from the map
      this._editableFG.leafletElement.removeLayer(layer)
    } else {
      const layerIdx = invisibleLayers.findIndex((layer) => layer.options.id === toggledPlan.id)
      // @ts-ignore, add layer to the map
      this._editableFG.leafletElement.addLayer(invisibleLayers[layerIdx])
      // Remove invisible layer
      invisibleLayers.splice(layerIdx, 1)
    }

    this.setState({ invisibleLayers })
  }

  changeLayerColor(selectedPlan: IPlan) {
    const { prevSelectedPlan } = this.props
    if (prevSelectedPlan) {
      const prevLayer: any = this.getLayerById(prevSelectedPlan.id)
      if (prevLayer) prevLayer.setStyle({ color: '#000080', dashArray: '0, 0' })
    }
    if (selectedPlan !== EmptyPlan) {
      const layer: any = this.getLayerById(selectedPlan.id)
      if (layer) layer.setStyle({ color: 'red', dashArray: '20, 20', dashOffset: '20' })
    }
  }

  loadInitialPlans = (plans: IPlan[]) => {
    if (!plans) return

    const collection: any = {
      name: 'Plans',
      type: 'FeatureCollection',
      features: [],
    }

    plans.forEach((p: IPlan) => {
      const plan: any = {
        type: 'Feature',
        properties: {
          id: p.id,
        },
        geometry: {
          type: p.survey ? 'Polygon' : 'LineString',
          coordinates: p.survey ? [[]] : [],
        },
      }
      const wps = p.waypoints
      wps.forEach((wp: IPositionAtTime) => {
        // Save plan geometric properties for layer drawing
        const coordinates = [wp.longitude, wp.latitude]
        if (p.survey) {
          plan.geometry.coordinates[0].push(coordinates)
        } else {
          plan.geometry.coordinates.push(coordinates)
        }
      })
      // Save plan area / length properties
      const latlngs = this.posService.getLatLngFromArray(wps)
      this.savePlanProperties(p.id, latlngs, p.survey)
      // Save feature on collection
      collection.features.push(plan)
    })
    // Store waypoints
    this.setState({ collection })
  }

  getLayerById(id: string) {
    if (!this._editableFG) return
    // @ts-ignore
    const { _layers } = this._editableFG.leafletElement
    return Object.values(_layers).find((layer: any) => layer.options.id === id)
  }

  seedPlanId() {
    const { currentUser } = this.props
    const currentDate = DateService.idfromDate(new Date())
    const planId = `${currentUser.name}-${currentDate}`
    this.setState({
      currentPlanId: planId,
    })
  }

  _onEdited = (e: any) => {
    const { plans } = this.props
    const { getILatLngFromArray } = this.posService

    const editedPlans: IPlan[] = []
    e.layers.eachLayer((layer: any) => {
      // Find current plan
      const plan: IPlan | undefined = plans.find((p) => p.id === layer.options.id)
      if (!plan) return

      // Update plan waypoint coordinates
      const planCopy = JSON.parse(JSON.stringify(plan))
      const coordinates = plan.survey ? layer._latlngs[0] : layer._latlngs
      planCopy.waypoints = getILatLngFromArray(coordinates)

      editedPlans.push(planCopy)
    })

    // Save edited plans
    this.handleEditPlan(editedPlans)

    // Update edited plan properties
    editedPlans.forEach((p) => this.updatePlanProperties(p))
  }

  _onCreated = (e: any) => {
    // Generate new plan ID
    this.seedPlanId()

    const { currentPlanId } = this.state
    const { getPosAtTime } = this.posService

    let waypoints: any = []
    let isSurvey = false

    // Layer's plan ID
    e.layer.options.id = currentPlanId

    // Plan waypoints and properties
    let latLngs: ILatLngs[] = []

    switch (e.layerType) {
      case 'polyline':
        // Calculate waypoints
        latLngs = e.layer._latlngs
        waypoints = getPosAtTime(latLngs)
        break
      case 'rectangle':
      case 'polygon':
        isSurvey = true
        // Set polygon layer to fill
        e.layer.setStyle({ fill: true })
        // Calculate waypoints
        latLngs = e.layer._latlngs[0]
        waypoints = getPosAtTime(latLngs)
        // Closing the polygon by repeating the first waypoint
        waypoints.push(waypoints[0])
        break
      default:
        break
    }

    // Save geodesic area and length
    this.savePlanProperties(currentPlanId, latLngs, isSurvey)

    // Show plan properties
    this.bindPopupToPlan(e.layer, currentPlanId)

    // Focus on created plan
    this.focusOnPlan(e.layer.getBounds())

    // Store plan
    this.insertPlan(waypoints, isSurvey)
  }

  _onDeleted = (e: any) => {
    const deletedLayers: string[] = []
    e.layers.eachLayer((layer: any) => {
      deletedLayers.push(layer.options.id)
    })
    this.handleDeletePlans(deletedLayers)
  }

  _onEditStart = (e: any) => {
    this.setState({ onEditMode: true })
  }

  _onEditStop = (e: any) => {
    this.setState({ onEditMode: false })
  }

  _onDeleteStart = (e: any) => {
    this.setState({ onEditMode: true })
  }

  _onDeleteStop = (e: any) => {
    this.setState({ onEditMode: false })
  }

  _onFeatureGroupReady = (reactFGref: any) => {
    const { collection, loadedPlans } = this.state

    if (!reactFGref || !collection || loadedPlans) return

    // populate FeatureGroup with the existent plans
    const leafletGeoJSON = new L.GeoJSON(collection)
    const leafletFG = reactFGref.leafletElement

    // Shape options
    const { shapeOptions } = PlanManager.polygonOptions

    leafletGeoJSON.eachLayer((layer: any) => {
      // Override layer drawing properties
      layer.options.id = layer.feature.properties.id
      layer.options.color = shapeOptions.color
      // Add layer to FeatureGroup
      leafletFG.addLayer(layer)
      // Show plan properties
      this.bindPopupToPlan(layer, layer.options.id)
    })

    this._editableFG = reactFGref

    this.setState({ loadedPlans: true })
  }

  buildWaypoints = () => {
    const { plans } = this.props
    const { getLatLng } = this.posService

    const visiblePlans = plans.filter((p) => p.visible && p.waypoints.length > 0)

    return visiblePlans.map((plan: IPlan) => {
      const wps: IVehicleAtTime[] = plan.waypoints
      const lastWpIdx: number = wps.length - 1

      return wps.map((wp, i) => {
        return (
          <Marker
            key={'Waypoint' + i + '_' + plan.id}
            index={i}
            position={getLatLng(wp)}
            icon={this.getWaypointIcon(i, lastWpIdx)}
            onClick={() => this.handleMarkerClick(i, plan)}
          >
            {this.buildMarkerPopup(plan, wp)}
          </Marker>
        )
      })
    })
  }

  getWaypointIcon(i: number, lastWpIdx: number) {
    return i === 0 ? new StartWaypointIcon() : i < lastWpIdx ? new WaypointIcon() : new FinishWaypointIcon()
  }

  buildMarkerPopup(plan: IPlan, wp: IVehicleAtTime) {
    const { selectedPlan, isEditingPlan } = this.props
    if (selectedPlan.id === plan.id && isEditingPlan) {
      return <WaypointPopup wp={wp} updateWaypoint={this.updateWaypoint} />
    }
  }

  updateWaypoint(wp: IVehicleAtTime, property: string, value: any) {
    const { plans, selectedPlan, updateWp } = this.props

    const newWp: IVehicleAtTime = Object.assign({}, wp)

    let param
    if (value instanceof Date) {
      param = value.getTime()
    } else {
      param = value ? parseFloat(value) : value
    }

    switch (property) {
      case 'latitude':
        newWp.latitude = param
        break
      case 'longitude':
        newWp.longitude = param
        break
      case 'depth':
        newWp.depth = param
        break
      case 'timestamp':
        newWp.timestamp = param
        break
      default:
        break
    }
    updateWp(newWp)

    // Update edited plan properties
    const plan: IPlan | undefined = plans.find((p) => p.id === selectedPlan.id)
    if (!plan) return
    this.updatePlanProperties(plan)

    // Update layer drawing positions
    this.updateLayerPositions(newWp)
  }

  updateLayerPositions(wp: IVehicleAtTime) {
    const { selectedPlan, selectedWaypointIdx } = this.props

    // @ts-ignore
    const layer: any = this.getLayerById(selectedPlan.id)
    if (!layer) return

    // Update path coordinates
    const coords = selectedPlan.survey ? layer._latlngs[0] : layer._latlngs
    coords[selectedWaypointIdx] = new LatLng(wp.latitude, wp.longitude)

    if (selectedPlan.survey) {
      // If start / finish waypoint changed, update each other
      if (selectedWaypointIdx === 0) {
        coords[coords.length - 1] = coords[0]
      } else if (selectedWaypointIdx === coords.length - 1) {
        coords[0] = coords[coords.length - 1]
      }
    }
  }

  handleMarkerClick(i: number, plan: IPlan): any {
    const {
      isEditingPlan,
      setSelectedWaypointIdx,
      setSidePanelTitle,
      setSidePanelContent,
      setSidePanelVisibility,
      setEditVehicle,
    } = this.props

    // Select waypoint
    setSelectedWaypointIdx(i)

    if (!isEditingPlan) {
      setSidePanelTitle(`Waypoint ${i} of ${plan.id}`)
      setSidePanelContent(this.getWaypointSidePanelProperties(plan.waypoints[i]))
      setSidePanelVisibility(true)
      setEditVehicle(undefined)
    }
  }

  getWaypointSidePanelProperties(wp: IVehicleAtTime) {
    return {
      eta: wp.timestamp ? DateService.timeFromNow(wp.timestamp) : 'N/D',
      'exact eta': wp.timestamp ? DateService.timestampMsToReadableDate(wp.timestamp) : 'N/D',
      lat: wp.latitude.toFixed(5),
      lng: wp.longitude.toFixed(5),
      'depth (m)': wp.depth.toFixed(5),
    }
  }

  savePlanProperties(planId: string, waypoints: ILatLngs[], isSurvey: boolean) {
    // Plan coverage area
    // @ts-ignore
    const area = isSurvey ? L.GeometryUtil.geodesicArea(waypoints) : 0

    // Path full length
    const wps = this.posService.getPositionsFromArray(waypoints)
    const length = this.posService.measureTotalDistance(wps)

    // Store properties
    this.planProperties.set(planId, {
      area,
      length,
    })

    // Update popup
    const layer: any = this.getLayerById(planId)
    if (layer) {
      const popup = layer.getPopup()
      const content = this.buildPlanPopupContent(planId)
      if (popup && content) popup.setContent(content)
    }
  }

  bindPopupToPlan(layer: Layer, planId: string) {
    const msg = this.buildPlanPopupContent(planId)
    if (msg) layer.bindPopup(msg)
  }

  buildPlanPopupContent(planId: string) {
    const properties = this.planProperties.get(planId)
    if (!properties) return
    // @ts-ignore
    const length = L.GeometryUtil.readableDistance(properties.length, true, false, false, 2)
    // @ts-ignore
    const area = L.GeometryUtil.readableArea(properties.area, ['km'], 2)
    let msg = `<strong>${planId}</strong><div><strong>Length:</strong> ${length}</div>`
    if (properties.area > 0) msg += `<div><strong>Area:</strong> ${area}</div>`
    return msg
  }

  insertPlan = (waypoints: ILatLngAtTime[], isSurvey: boolean) => {
    const { currentPlanId } = this.state
    const { currentUser, addNewPlan } = this.props
    const { getILatLngFromArray } = this.posService

    const date = DateService.timestampMsToReadableDate(Date.now())
    const wps: IVehicleAtTime[] = getILatLngFromArray(waypoints)

    const plan: IPlan = {
      assignedTo: '',
      description: `Plan created by ${currentUser.email} on ${date}`,
      id: currentPlanId,
      waypoints: wps,
      visible: true,
      type: 'backseat',
      survey: isSurvey,
    }

    // Store to redux
    addNewPlan(plan)
    // Store to server
    this.handleSavePlan(plan)
  }

  async handleSavePlan(plan: IPlan) {
    try {
      const response = await this.soiService.sendUnassignedPlan(plan)
      NotificationManager.success(response.message)
    } catch (error) {
      NotificationManager.warning(error.message)
    }
  }

  async handleDeletePlan(planId: string) {
    try {
      await this.soiService.deleteUnassignedPlan(planId)
      NotificationManager.success(`Plan ${planId} has been deleted`)
    } catch (error) {
      NotificationManager.warning(error.message)
    }
  }

  async handleDeletePlans(planIds: string[]) {
    const { removePlan } = this.props

    if (planIds.length === 0) return

    let errorOccurred = false
    planIds.forEach(async (planId: string) => {
      try {
        removePlan(planId)
        await this.soiService.deleteUnassignedPlan(planId)
      } catch (error) {
        errorOccurred = true
      }
    })

    errorOccurred
      ? NotificationManager.warning('Some plans could not be deleted!')
      : planIds.length > 1
      ? NotificationManager.success(`Selected plans have been deleted`)
      : NotificationManager.success(`Plan of id ${planIds[0]} has been deleted`)
  }

  async handleEditPlan(plans: IPlan[]) {
    const { updatePlan } = this.props

    if (plans.length === 0) return

    let errorOccurred = false
    plans.forEach(async (plan: IPlan) => {
      try {
        updatePlan(plan)
        await this.soiService.sendUnassignedPlan(plan)
      } catch (error) {
        errorOccurred = true
      }
    })

    errorOccurred
      ? NotificationManager.warning('Some plans could not be edited!')
      : plans.length > 1
      ? NotificationManager.success(`Selected plans have been edited`)
      : NotificationManager.success(`Plan of id ${plans[0].id} has been edited`)
  }

  focusOnPlan(layerBounds: any) {
    const { mapRef } = this.props
    mapRef.leafletElement.fitBounds(layerBounds)
  }

  render() {
    const { onEditMode } = this.state
    return (
      <FeatureGroup
        ref={(reactFGref) => {
          this._onFeatureGroupReady(reactFGref)
        }}
      >
        <EditControl
          position="topleft"
          onEdited={this._onEdited}
          onCreated={this._onCreated}
          onDeleted={this._onDeleted}
          onEditStart={this._onEditStart}
          onEditStop={this._onEditStop}
          onDeleteStart={this._onDeleteStart}
          onDeleteStop={this._onDeleteStop}
          draw={{
            polyline: PlanManager.polygonOptions,
            rectangle: PlanManager.polygonOptions,
            polygon: PlanManager.polygonOptions,
            circle: false,
            marker: false,
            circlemarker: false,
          }}
          edit={{
            allowIntersection: false,
            featureGroup: this._editableFG,
          }}
        />
        {!onEditMode && this.buildWaypoints()}
      </FeatureGroup>
    )
  }
}

function mapStateToProps(state: IRipplesState) {
  return {
    currentUser: state.auth.currentUser,
    plans: state.planSet,
    selectedPlan: state.selectedPlan,
    prevSelectedPlan: state.prevSelectedPlan,
    toggledPlan: state.toggledPlan,
    toolSelected: state.toolSelected,
    isEditingPlan: state.isEditingPlan,
    isAnotherSelectedPlan: state.isAnotherSelectedPlan,
    selectedWaypointIdx: state.selectedWaypointIdx,
    updatingPlanId: state.updatingPlanId,
  }
}

const actionCreators = {
  addNewPlan,
  updatePlan,
  removePlan,
  setSelectedWaypointIdx,
  setSidePanelContent,
  setSidePanelTitle,
  setSidePanelVisibility,
  setEditVehicle,
  updateWp,
  updateWpLocation,
  updateWpTimestamp,
}

export default connect(mapStateToProps, actionCreators)(PlanManager)
