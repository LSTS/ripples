import React, { Component } from 'react'
import { Popup } from 'react-leaflet'
import { AISOrangeShipIcon, AISGreenShipIcon, AISRedShipIcon, AISBlueShipIcon, AISAntennaIcon, AISYellowShipIcon } from './Icons'
import RotatedMarker from './RotatedMarker'
import { timeFromNow } from '../../../services/DateUtils';
import IAisShip from '../../../model/IAisShip';
import IRipplesState from '../../../model/IRipplesState';
import { connect } from 'react-redux';
import AssetAwareness from './AssetAwareness';
import IAssetAwareness from '../../../model/IAssetAwareness';


type propsType = {
    data: IAisShip,
    sliderValue: number
}

class AISShip extends Component<propsType, {}> {

    awarenessMinSpeed: number = 0.2

    constructor(props: propsType) {
        super(props)
        this.buildAisShipMarker = this.buildAisShipMarker.bind(this)
        this.buildShipAwareness = this.buildShipAwareness.bind(this)
    }

    getIcon(type: number) {
        const tenths = Math.floor(type / 10);
        switch (tenths) {
            case 0: // antenna
                return new AISAntennaIcon();
            case 3: // orange - fishing
                return new AISOrangeShipIcon();
            case 6: // blue - passenger
                return new AISBlueShipIcon();
            case 7: // green - cargo
                return new AISGreenShipIcon();
            case 8: // red - tanker
                return new AISRedShipIcon();
            default: // yellow - others
                return new AISYellowShipIcon();
        }
    }

    getOpacity(lastUpdate: number){
        let deltaTimeSec = Math.round((Date.now() - lastUpdate)/1000);
        return 0.36 + (1.000 - 0.36)/(1 + Math.pow((deltaTimeSec/8000),0.9))
    }

    buildShipAwareness() {
        const deltaHours = this.props.sliderValue
        const awareness: IAssetAwareness = {
            name: this.props.data.name,
            positions: this.props.data.awareness
        }
        return <AssetAwareness awareness={awareness} deltaHours={deltaHours}></AssetAwareness>
    }

    buildAisShipMarker() {
        let ship = this.props.data;
        return (
            <RotatedMarker
                position={{ lat: ship.latitude, lng: ship.longitude }}
                rotationAngle={Math.round(ship.cog)}
                rotationOrigin={'center'}
                icon={this.getIcon(Number(ship.type))}
                opacity={this.getOpacity(ship.updated_at)}>
                <Popup>
                    <h3>{ship.name} - {ship.mmsi}</h3>
                    <ul>
                        <li>Lat: {ship.latitude.toFixed(5)}</li>
                        <li>Lng: {ship.longitude.toFixed(5)}</li>
                        <li>Heading: {ship.heading.toFixed(1)}</li>
                        <li>Cog: {ship.cog.toFixed(1)}</li>
                        <li>Sog: {(ship.sog).toFixed(1)} knots</li>
                        <li>Type: {ship.type}</li>
                        <li>Last update: {timeFromNow(ship.updated_at)}</li>
                    </ul>
                </Popup>
            </RotatedMarker>
        );
    }

    render() {
        let ship = this.props.data
        let shipAwareness: JSX.Element | null = null
        if (this.props.sliderValue != 0 && ship.sog > this.awarenessMinSpeed) {
            shipAwareness = this.buildShipAwareness()
        }
        return (
            <>
            {this.buildAisShipMarker()}
            {shipAwareness}
            </>
        )

    }
}

function mapStateToProps(state: IRipplesState) {
    const { sliderValue } = state
    return {
        sliderValue: sliderValue
    }
}

export default connect(mapStateToProps, null)(AISShip)