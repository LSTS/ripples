import React, { Component } from 'react'
import { connect } from 'react-redux'
import IAsset from '../../../model/IAsset'
import IAssetAwareness from '../../../model/IAssetAwareness'
import IRipplesState from '../../../model/IRipplesState'
import { setSidePanelContent, setSidePanelTitle, setSidePanelVisibility } from '../../../redux/ripples.actions'
import { timeFromNow } from '../../../services/DateUtils'
import { getLatLng } from '../../../services/PositionUtils'
import AssetAwareness from './AssetAwareness'
import { AuvIcon } from './Icons'
import RotatedMarker from './RotatedMarker'

interface PropsType {
  data: IAsset
  sliderValue: number
  setSidePanelTitle: (title: string) => void
  setSidePanelContent: (content: any) => void
  setSidePanelVisibility: (v: boolean) => void
}

class Vehicle extends Component<PropsType, {}> {
  public icon = new AuvIcon()

  constructor(props: PropsType) {
    super(props)
    this.buildVehicleAwareness = this.buildVehicleAwareness.bind(this)
    this.buildVehicle = this.buildVehicle.bind(this)
  }

  public buildSettings(settings: string[][]): any {
    const object: any = {}
    for (const pair of settings) {
      object[pair[0]] = pair[1]
    }
    return object
  }

  public buildVehicleAwareness(): JSX.Element {
    const currentVehicle = this.props.data
    const deltaHours = this.props.sliderValue
    const vehicleAwareness: IAssetAwareness = {
      name: currentVehicle.name,
      positions: currentVehicle.awareness,
    }
    return <AssetAwareness awareness={vehicleAwareness} deltaHours={deltaHours} icon={this.icon} />
  }

  public getDisplayableProperties(vehicle: IAsset) {
    const mainProps = {
      heading: vehicle.lastState.heading.toFixed(2),
      'last update': timeFromNow(vehicle.lastState.timestamp),
      latitude: vehicle.lastState.latitude.toFixed(5),
      longitude: vehicle.lastState.longitude.toFixed(5),
      plan: vehicle.planId,
    }
    const settingsProps = this.buildSettings(vehicle.settings)
    return Object.assign({}, mainProps, settingsProps)
  }

  public handleClick(vehicle: IAsset) {
    // evt.originalEvent.view.L.DomEvent.stop(evt)
    this.props.setSidePanelTitle(vehicle.name)
    this.props.setSidePanelContent(this.getDisplayableProperties(vehicle))
    this.props.setSidePanelVisibility(true)
  }

  public buildVehicle() {
    const vehicle = this.props.data
    const systemPosition = getLatLng(vehicle.lastState)
    return (
      <RotatedMarker
        position={systemPosition}
        icon={this.icon}
        rotationAngle={vehicle.lastState.heading - 90} // -90 is used to compensate for the icon
        rotationOrigin={'center'}
        onClick={(evt: any) => this.handleClick(vehicle)}
      />
    )
  }

  public render() {
    let awarenessJSX: JSX.Element | null = null
    if (this.props.sliderValue !== 0) {
      awarenessJSX = this.buildVehicleAwareness()
    }
    return (
      <>
        {this.buildVehicle()}
        {awarenessJSX}
      </>
    )
  }
}

const actionCreators = {
  setSidePanelContent,
  setSidePanelTitle,
  setSidePanelVisibility,
}

function mapStateToProps(state: IRipplesState) {
  return {
    sliderValue: state.sliderValue,
  }
}

export default connect(
  mapStateToProps,
  actionCreators
)(Vehicle)
