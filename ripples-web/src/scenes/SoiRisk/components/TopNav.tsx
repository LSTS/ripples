import React, { Component, ChangeEvent } from "react";
import Navbar from "reactstrap/lib/Navbar";
import NavbarBrand from "reactstrap/lib/NavbarBrand";
import NavbarToggler from "reactstrap/lib/NavbarToggler";
import Collapse from "reactstrap/lib/Collapse";
import Nav from "reactstrap/lib/Nav";
import Login from "../../../components/Login";
import NavItem from "reactstrap/lib/NavItem";
import Form from "reactstrap/lib/Form";
import FormGroup from "reactstrap/lib/FormGroup";
import Label from "reactstrap/lib/Label";
import Input from "reactstrap/lib/Input";
import Button from "reactstrap/lib/Button";
import { subscribeToSms } from "../../../services/SoiUtils";
import 'react-notifications/lib/notifications.css';
const { NotificationManager } = require('react-notifications');

type propsType = {}
type stateType = {
    isNavOpen: boolean
    phoneNumber: string
}

export default class TopNav extends Component<propsType, stateType>{

    constructor(props: propsType) {
        super(props)
        this.state = {
            isNavOpen: true,
            phoneNumber: "",
        }
        this.buildSmsSubscriber = this.buildSmsSubscriber.bind(this)
        this.onPhoneSubmit = this.onPhoneSubmit.bind(this)
        this.onPhoneChanged = this.onPhoneChanged.bind(this)
    }

    onNavToggle() {
        this.setState({ isNavOpen: !this.state.isNavOpen });
    }

    async onPhoneSubmit() {
        try {
            await subscribeToSms(this.state.phoneNumber);
            NotificationManager.success(`${this.state.phoneNumber} subscribed`)
            this.setState({ phoneNumber: "" });
        } catch (e) {
            NotificationManager.warning(`Could not subscribe ${this.state.phoneNumber}`)
        }

    }

    onPhoneChanged(event: any) {
        this.setState({ phoneNumber: event.target.value })
    }


    buildSmsSubscriber() {
        return <NavItem>
            <Form inline>
                <FormGroup>
                    <Input placeholder="phone number" onChange={this.onPhoneChanged} value={this.state.phoneNumber} />
                </FormGroup>
                <Button onClick={this.onPhoneSubmit}>Submit</Button>
            </Form>
        </NavItem>
    }

    render() {
        return (
            <Navbar color="faded" light expand="md">
                <NavbarBrand className="mr-auto" href="/">Ripples</NavbarBrand>
                <NavbarToggler className="mr-2" onClick={this.onNavToggle} />
                <Collapse isOpen={this.state.isNavOpen} navbar>
                    <Nav className="ml-auto" navbar>
                        {this.buildSmsSubscriber()}
                        <Login></Login>
                    </Nav>
                </Collapse>
            </Navbar>)
    }
}