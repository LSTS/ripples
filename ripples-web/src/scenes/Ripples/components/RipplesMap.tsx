import React, { Component } from 'react'
import { GeoJSON, LayerGroup, LayersControl, Map, TileLayer, WMSTileLayer } from 'react-leaflet'
import 'react-leaflet-fullscreen-control'
import { connect } from 'react-redux'
import IAisShip, { IShipLocation } from '../../../model/IAisShip'
import IAsset from '../../../model/IAsset'
import IRipplesState from '../../../model/IRipplesState'
import {
  addWpToPlan,
  setSelectedWaypointIdx,
  setSidePanelContent,
  setSidePanelTitle,
  setSidePanelVisibility,
  updateWpLocation,
} from '../../../redux/ripples.actions'
import AISShip from './AISShip'
import SimpleAsset from './SimpleAsset'
import Vehicle from './Vehicle'
const { BaseLayer, Overlay } = LayersControl
import { LatLngLiteral } from 'leaflet'
import ILatLng from '../../../model/ILatLng'
import IPlan from '../../../model/IPlan'
import IPositionAtTime from '../../../model/IPositionAtTime'
import IProfile from '../../../model/IProfile'
import { ToolSelected } from '../../../model/ToolSelected'
import AISCanvas from './AISCanvas'
import ClientLocation from './ClientLocation'
import { PCIcon, SpotIcon } from './Icons'
import VehiclePlan from './VehiclePlan'
import VerticalProfile from './VerticalProfile'
const CanvasLayer = require('react-leaflet-canvas-layer')

interface PropsType {
  myMapsData: any
  aisLocations: IShipLocation[]
  vehicles: IAsset[]
  spots: IAsset[]
  ccus: IAsset[]
  aisShips: IAisShip[]
  profiles: IProfile[]
  plans: IPlan[]
  selectedPlan: IPlan
  selectedWaypointIdx: number
  toolSelected: ToolSelected
  setSelectedWaypointIdx: (_: number) => void
  updateWpLocation: (_: ILatLng) => void
  addWpToPlan: (_: IPositionAtTime) => void
  setSidePanelVisibility: (_: boolean) => void
  setSidePanelTitle: (_: string) => void
  setSidePanelContent: (_: any) => void
}

interface StateType {
  initCoords: LatLngLiteral
  isToDrawAisLocations: boolean
  perpLinesSize: number
}

class RipplesMap extends Component<PropsType, StateType> {
  public upgradedOptions: any
  public initZoom = 10

  constructor(props: PropsType) {
    super(props)
    const initCoords = { lat: 41.18, lng: -8.7 }
    this.state = {
      initCoords,
      isToDrawAisLocations: false,
      perpLinesSize: 10,
    }
    this.buildProfiles = this.buildProfiles.bind(this)
    this.buildVehicles = this.buildVehicles.bind(this)
    this.buildSpots = this.buildSpots.bind(this)
    this.buildAisShips = this.buildAisShips.bind(this)
    this.handleMapClick = this.handleMapClick.bind(this)
    this.handleZoom = this.handleZoom.bind(this)
    this.drawCanvas = this.drawCanvas.bind(this)
    this.toggleDrawAisLocations = this.toggleDrawAisLocations.bind(this)
    this.buildMyMaps = this.buildMyMaps.bind(this)
  }

  /**
   * Move waypoint if a plan and a waypoint are selected
   * @param e
   */
  public handleMapClick(e: any) {
    this.props.setSidePanelVisibility(false)
    if (this.props.selectedPlan.id.length === 0) {
      return
    }
    const clickLocation = { latitude: e.latlng.lat, longitude: e.latlng.lng }
    switch (this.props.toolSelected) {
      case ToolSelected.ADD: {
        this.props.addWpToPlan(Object.assign({}, clickLocation, { timestamp: 0 }))
        break
      }
      case ToolSelected.MOVE: {
        if (this.props.selectedWaypointIdx !== -1) {
          this.props.updateWpLocation(clickLocation)
          this.props.setSelectedWaypointIdx(-1)
        }
      }
    }
  }

  public getGeoJSONSidePanelProperties(properties: any) {
    let obj = {}
    if (properties.lat) {
      obj = Object.assign({}, obj, { lat: properties.lat })
    }
    if (properties.lon) {
      obj = Object.assign({}, obj, { lng: properties.lon })
    }
    if (properties.CATEGORIA) {
      obj = Object.assign({}, obj, { category: properties.CATEGORIA })
    }
    return obj
  }

  public buildMyMaps() {
    return (
      <GeoJSON
        data={this.props.myMapsData}
        style={(feature: any) => {
          return {
            color: feature.properties.stroke,
            weight: feature.properties['stroke-width'],
          }
        }}
        onEachFeature={(feature, layer) => {
          if (feature.properties && feature.properties.name) {
            layer.on('click', (evt: any) => {
              evt.originalEvent.view.L.DomEvent.stopPropagation(evt)
              this.props.setSidePanelTitle(feature.properties.name)
              this.props.setSidePanelContent(this.getGeoJSONSidePanelProperties(feature.properties))
              this.props.setSidePanelVisibility(true)
            })
          }
        }}
      />
    )
  }

  public buildProfiles() {
    return this.props.profiles.map((profile, i) => {
      return <VerticalProfile key={'profile' + i} data={profile} />
    })
  }

  public buildSpots() {
    return this.props.spots.map(spot => {
      return <SimpleAsset key={spot.imcid} data={spot} icon={new SpotIcon()} />
    })
  }

  public buildCcus() {
    return this.props.ccus.map(ccu => {
      return <SimpleAsset key={ccu.name} data={ccu} icon={new PCIcon()} />
    })
  }

  public buildPlans(): JSX.Element[] {
    return this.props.plans.map(p => {
      return <VehiclePlan key={'VehiclePlan' + p.id + ';' + p.assignedTo} plan={p} vehicle={p.assignedTo} />
    })
  }

  public buildVehicles() {
    return this.props.vehicles.map(vehicle => {
      return <Vehicle key={vehicle.imcid} data={vehicle} />
    })
  }

  public buildAisShips() {
    return this.props.aisShips.map(ship => {
      return <AISShip key={'Ship_' + ship.mmsi} ship={ship} />
    })
  }

  public drawCanvas(info: any) {
    const ctx = info.canvas.getContext('2d')
    ctx.clearRect(0, 0, info.canvas.width, info.canvas.height)
    ctx.fillStyle = 'rgba(255,116,0, 0.2)'
    this.props.aisShips.forEach(ship => {
      const aisCanvas = new AISCanvas({
        drawLocation: this.state.isToDrawAisLocations,
        perpLinesSize: this.state.perpLinesSize,
        ship,
      })
      aisCanvas.drawInCanvas(info)
    })
  }

  public handleZoom(e: any) {
    const newZoom = e.target._animateToZoom
    let newLineLength = 0
    if (newZoom > 7) {
      newLineLength = 138598 * Math.pow(newZoom, -2.9)
      this.setState({
        perpLinesSize: Math.round(newLineLength),
      })
      if (newZoom > 12) {
        if (!this.state.isToDrawAisLocations) {
          this.toggleDrawAisLocations()
        }
      } else {
        if (this.state.isToDrawAisLocations) {
          this.toggleDrawAisLocations()
        }
      }
    }
  }

  public toggleDrawAisLocations() {
    this.setState({
      isToDrawAisLocations: !this.state.isToDrawAisLocations,
    })
  }

  public render() {
    return (
      <Map
        fullscreenControl={true}
        center={this.state.initCoords}
        zoom={this.initZoom}
        maxZoom={20}
        onClick={this.handleMapClick}
        onZoomend={this.handleZoom}
      >
        <LayersControl position="topright">
          <BaseLayer checked={true} name="OpenStreetMap">
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>
          <BaseLayer name="ArcGIS NatGeo">
            <TileLayer
              url="http://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}"
              maxZoom={16}
              attribution="Map data &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC"
              id="examples.map-i875mjb7"
            />
          </BaseLayer>
          <BaseLayer name="ArcGIS Ocean">
            <TileLayer
              url="http://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; ESRI"
              maxZoom={13}
            />
          </BaseLayer>
          <BaseLayer name="ArcGis World Imagery">
            <TileLayer
              url="http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; ESRI"
            />
          </BaseLayer>
          <BaseLayer name="Thunder Forest">
            <TileLayer
              url="https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=c4d207cad22c4f65b9adb1adbbaef141"
              attribution="Tiles &copy; ThunderForest"
            />
          </BaseLayer>
          <BaseLayer name="GMRT">
            <WMSTileLayer
              layers="gmrt"
              url="https://www.gmrt.org/services/mapserver/wms_merc?service=WMS&version=1.0.0&request=GetMap"
              attribution="GEBCO (multiple sources)"
            />
          </BaseLayer>
          <Overlay name="Argos">
            <WMSTileLayer
              url="http://www.ifremer.fr/services/wms/coriolis/co_argo_floats_activity"
              layers="StationProject"
              attribution="IFREMER"
              format="image/png"
              project=""
              transparent={true}
            />
          </Overlay>
          <Overlay name="AIS density">
            <TileLayer
              url="https://tiles2.marinetraffic.com/ais/density_tiles2015/{z}/{x}/tile_{z}_{x}_{y}.png"
              attribution="Map data &copy; MarineTraffic"
              maxZoom={21}
              opacity={0.5}
              maxNativeZoom={10}
            />
          </Overlay>
          <Overlay name="Copernicus SST">
            <WMSTileLayer
              url="http://nrt.cmems-du.eu/thredds/wms/global-analysis-forecast-phy-001-024"
              layers="thetao"
              format="image/png"
              styles="boxfill/sst_36"
              transparent={true}
              colorscalerange="0,36"
              belowmincolor="extend"
              belowmaxcolor="extend"
              opacity={0.8}
              attribution="E.U. Copernicus Marine Service Information"
            />
          </Overlay>
          <Overlay name="Copernicus SSSC">
            <WMSTileLayer
              url="http://nrt.cmems-du.eu/thredds/wms/global-analysis-forecast-phy-001-024"
              layers="so"
              format="image/png"
              styles="boxfill/rainbow"
              transparent={true}
              colorscalerange="33,36"
              belowmincolor="extend"
              belowmaxcolor="extend"
              attribution="E.U. Copernicus Marine Service Information"
            />
          </Overlay>
          <Overlay name="Copernicus SSV">
            <WMSTileLayer
              url="http://nrt.cmems-du.eu/thredds/wms/global-analysis-forecast-phy-001-024"
              layers="sea_water_velocity"
              format="image/png"
              styles="vector/rainbow"
              transparent={true}
              colorscalerange="0,2"
              belowmincolor="extend"
              belowmaxcolor="extend"
              opacity={0.8}
              attribution="E.U. Copernicus Marine Service Information"
            />
          </Overlay>
          <Overlay name="Copernicus ZOS">
            <WMSTileLayer
              url="http://nrt.cmems-du.eu/thredds/wms/global-analysis-forecast-phy-001-024"
              layers="zos"
              format="image/png"
              styles="boxfill/rainbow"
              transparent={true}
              colorscalerange="-1,1"
              belowmincolor="extend"
              belowmaxcolor="extend"
              opacity={0.8}
              attribution="E.U. Copernicus Marine Service Information"
            />
          </Overlay>
          <Overlay name="Copernicus CHL">
            <WMSTileLayer
              url="http://nrt.cmems-du.eu/thredds/wms/dataset-oc-glo-chl-multi-l4-oi_4km_daily-rt-v02"
              layers="CHL"
              format="image/png"
              styles="boxfill/alg2"
              transparent={true}
              logscale="true"
              colorscalerange="0.01,10.0"
              belowmincolor="extend"
              belowmaxcolor="extend"
              opacity={0.8}
              attribution="E.U. Copernicus Marine Service Information"
            />
          </Overlay>
          <Overlay name="Copernicus Waves">
            <WMSTileLayer
              url="http://nrt.cmems-du.eu/thredds/wms/global-analysis-forecast-wav-001-027"
              styles="boxfill/rainbow"
              layers="VHM0"
              colorscalerange="0.01,8.0"
              belowmincolor="extend"
              belowmaxcolor="extend"
              transparent={true}
              format="image/png"
              opacity={0.8}
              attribution="E.U. Copernicus Marine Service Information"
            />
          </Overlay>
          <Overlay name="Copernicus Wind">
            <WMSTileLayer
              url="http://nrt.cmems-du.eu/thredds/wms/CERSAT-GLO-BLENDED_WIND_L4-V6-OBS_FULL_TIME_SERIE"
              styles="vector/rainbow"
              layers="wind"
              elevation={10}
              colorscalerange="0.0,23.0"
              belowmincolor="extend"
              belowmaxcolor="extend"
              transparent={true}
              format="image/png"
              opacity={0.8}
              attribution="E.U. Copernicus Marine Service Information"
            />
          </Overlay>
          <Overlay name="Copernicus SLA">
            <WMSTileLayer
              url="http://nrt.cmems-du.eu/thredds/wms/dataset-duacs-nrt-global-merged-allsat-phy-l4"
              layers="ugosa"
              format="image/png"
              transparent={true}
              styles="boxfill/redblue"
              colorscalerange="-0.8,0.8"
              belowmincolor="extend"
              belowmaxcolor="extend"
              opacity={0.8}
              attribution="E.U. Copernicus Marine Service Information"
            />
          </Overlay>

          <Overlay checked={true} name="MyMaps">
            <LayerGroup>{this.buildMyMaps()}</LayerGroup>
          </Overlay>
          <Overlay checked={true} name="Vehicles">
            <LayerGroup>{this.buildVehicles()}</LayerGroup>
          </Overlay>
          <Overlay checked={true} name="Plans">
            <LayerGroup>{this.buildPlans()}</LayerGroup>
          </Overlay>
          <Overlay checked={true} name="Spots">
            <LayerGroup>{this.buildSpots()}</LayerGroup>
          </Overlay>
          <Overlay checked={true} name="CCUS">
            <LayerGroup>{this.buildCcus()}</LayerGroup>
          </Overlay>
          <Overlay checked={true} name="AIS Data">
            <LayerGroup>
              {this.buildAisShips()}
              <CanvasLayer drawMethod={this.drawCanvas} />
            </LayerGroup>
          </Overlay>
          <Overlay checked={true} name="Profiles Data">
            <LayerGroup>{this.buildProfiles()}</LayerGroup>
          </Overlay>
          <Overlay checked={true} name="Current Location">
            <LayerGroup>
              <ClientLocation />
            </LayerGroup>
          </Overlay>
        </LayersControl>
      </Map>
    )
  }
}

function mapStateToProps(state: IRipplesState) {
  return {
    aisLocations: state.assets.aisDrawableLocations,
    aisShips: state.assets.aisShips,
    plans: state.planSet,
    profiles: state.profiles,
    selectedPlan: state.selectedPlan,
    selectedWaypointIdx: state.selectedWaypointIdx,
    spots: state.assets.spots,
    ccus: state.assets.ccus,
    toolSelected: state.toolSelected,
    vehicles: state.assets.vehicles,
  }
}

const actionCreators = {
  addWpToPlan,
  setSelectedWaypointIdx,
  setSidePanelContent,
  setSidePanelTitle,
  setSidePanelVisibility,
  updateWpLocation,
}

export default connect(
  mapStateToProps,
  actionCreators
)(RipplesMap)
