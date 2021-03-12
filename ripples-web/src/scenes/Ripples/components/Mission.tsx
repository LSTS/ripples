import React, { Component } from 'react'
import { connect } from 'react-redux'
import { setSidePanelContent, setSidePanelTitle, setSidePanelVisibility } from '../../../redux/ripples.actions'
import IMission from '../../../model/IMission'
import * as L from 'leaflet'
import 'leaflet.markercluster/dist/leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

interface PropsType {
  markers: IMission[]
  missionsOpen: IMission[]
  map: L.Map
  icon: L.Icon
  setSidePanelTitle: (title: string) => void
  setSidePanelContent: (content: any) => void
  setSidePanelVisibility: (v: boolean) => void
  handleDisplayImage?: (mission: IMission) => void
}
interface StateType {
  loading: boolean
}

class Mission extends Component<PropsType, StateType> {
  constructor(props: PropsType) {
    super(props)
    this.state = {
      loading: true,
    }
  }

  public buildAllMissionImage() {
    if (this.props.missionsOpen) {
      this.props.missionsOpen.forEach((mission) => {
        const SW = new L.LatLng(mission.boundingBox.minY, mission.boundingBox.minX)
        const NE = new L.LatLng(mission.boundingBox.maxY, mission.boundingBox.maxX)
        const imgBounds = L.latLngBounds(SW, NE)

        const name = 'missionImage_' + mission.path
        const urlImage = process.env.REACT_APP_MISSION_REPOSITORY_API + mission.path

        if (this.props.map) {
          L.imageOverlay(urlImage, imgBounds, { alt: name, interactive: true }).addTo(this.props.map)
        }
      })
    }
  }

  public buildMissionCluster() {
    if (this.props.markers && this.props.map) {
      // remove cluster
      this.props.map.eachLayer((layer: any) => {
        if (layer._featureGroup) {
          if (this.props.map) {
            this.props.map.removeLayer(layer)
          }
        }
      })

      const mcg = (L as any).markerClusterGroup({
        showCoverageOnHover: false,
        animateAddingMarkers: true,
        spiderfyDistanceMultiplier: 1.3,
        maxClusterRadius: 40,
      })

      this.props.markers.forEach((mark, ind) => {
        const SW = new L.LatLng(mark.boundingBox.minY, mark.boundingBox.minX)
        const NE = new L.LatLng(mark.boundingBox.maxY, mark.boundingBox.maxX)
        const imgBounds = L.latLngBounds(SW, NE)
        const center = imgBounds.getCenter()

        L.marker(new L.LatLng(center.lat, center.lng), {
          icon: this.props.icon,
          alt: 'missionMarker_' + mark.path,
        }).addTo(mcg)
      })
      this.props.map.addLayer(mcg)

      mcg.on('click', (m: any) => {
        const missionPath = m.layer.options.alt.split(/_(.+)/)[1]

        if (this.props.markers) {
          const mission = this.props.markers.filter((mission) => mission.path === missionPath)[0]
          if (mission) {
            this.props.setSidePanelTitle(mission.mission)
            this.props.setSidePanelContent({
              Date: new Date(mission.date).toDateString(),
              Location: mission.location,
              Plan: mission.plan,
              Vehicle: mission.vehicle,
            })
            this.props.setSidePanelVisibility(true)

            if (this.props.handleDisplayImage !== undefined) {
              this.props.handleDisplayImage(mission)
            }
          }
        }
      })
    }
  }

  public componentDidUpdate() {
    this.buildMissionCluster()
    this.buildAllMissionImage()
  }

  public render() {
    return <></>
  }
}

const actionCreators = {
  setSidePanelContent,
  setSidePanelTitle,
  setSidePanelVisibility,
}

export default connect(null, actionCreators)(Mission)
