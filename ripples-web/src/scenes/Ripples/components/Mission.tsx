import React, { Component } from 'react'
import { Marker, ImageOverlay } from 'react-leaflet'
import { connect } from 'react-redux'
import { setSidePanelContent, setSidePanelTitle, setSidePanelVisibility } from '../../../redux/ripples.actions'
import IMission from '../../../model/IMission'
import L from 'leaflet'

interface PropsType {
  data: IMission
  icon?: L.Icon
  displayMarker: boolean
  setSidePanelTitle: (title: string) => void
  setSidePanelContent: (content: any) => void
  setSidePanelVisibility: (v: boolean) => void

  handleDisplayImage?: (mission: IMission) => void
}

class Mission extends Component<PropsType, {}> {
  constructor(props: PropsType) {
    super(props)
    this.onMarkerClick = this.onMarkerClick.bind(this)
  }

  public buildMissionMarker() {
    const mission = this.props.data
    const SW = new L.LatLng(mission.boundingBox.minY, mission.boundingBox.minX)
    const NE = new L.LatLng(mission.boundingBox.maxY, mission.boundingBox.maxX)
    const imgBounds = L.latLngBounds(SW, NE)
    const center = imgBounds.getCenter()

    return (
      <Marker
        alt={'missionMarker_' + this.props.data.path}
        position={[center.lat, center.lng]}
        icon={this.props.icon}
        onClick={this.onMarkerClick}
      />
    )
  }

  public buildMissionImage() {
    const mission = this.props.data
    const SW = new L.LatLng(mission.boundingBox.minY, mission.boundingBox.minX)
    const NE = new L.LatLng(mission.boundingBox.maxY, mission.boundingBox.maxX)
    const imgBounds = L.latLngBounds(SW, NE)

    // const urlImage = 'http://localhost:3002/image/' + mission.path
    const urlImage = process.env.REACT_APP_MISSION_REPOSITORY_API + mission.path

    return (
      <ImageOverlay alt={'missionImage_' + this.props.data.path} url={urlImage} bounds={imgBounds} interactive={true} />
    )
  }

  private onMarkerClick(evt: any) {
    // evt: L.LeafletMouseEvent

    // const missionPath = evt.originalEvent.srcElement.alt.split(/_(.+)/)[1]
    // console.log(missionPath)

    const mission = this.props.data
    // evt.originalEvent.view.L.DomEvent.stopPropagation(evt)

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

  public render() {
    if (this.props.displayMarker) {
      return <>{this.buildMissionMarker()}</>
    } else {
      return <>{this.buildMissionImage()}</>
    }
  }
}

const actionCreators = {
  setSidePanelContent,
  setSidePanelTitle,
  setSidePanelVisibility,
}

export default connect(null, actionCreators)(Mission)
