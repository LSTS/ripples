import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Button } from 'reactstrap'
import IAuthState from '../model/IAuthState'
import IRipplesState from '../model/IRipplesState'
import { ToolSelected } from '../model/ToolSelected'
import { removeGeoLayers, removeUser, setToolSelected } from '../redux/ripples.actions'

const GOOGLE_AUTH_URL =
  process.env.REACT_APP_API_BASE_URL +
  '/oauth2/authorize/google?redirect_uri=' +
  process.env.REACT_APP_OAUTH2_REDIRECT_URI

const GITHUB_AUTH_URL =
  process.env.REACT_APP_API_BASE_URL +
  '/oauth2/authorize/github?redirect_uri=' +
  process.env.REACT_APP_OAUTH2_REDIRECT_URI

interface PropsType {
  auth: IAuthState
  removeGeoLayers: () => void
  removeUser: () => void
  setToolSelected: (_: ToolSelected) => void
}

class Login extends Component<PropsType, {}> {
  constructor(props: PropsType) {
    super(props)
    this.handleLogout = this.handleLogout.bind(this)
  }

  public handleLoginClick() {
    window.location.href = GOOGLE_AUTH_URL
  }

  public handleLoginClickGithub() {
    window.location.href = GITHUB_AUTH_URL
  }

  public handleLogout() {
    this.props.setToolSelected(ToolSelected.NONE)
    localStorage.removeItem('ACCESS_TOKEN')
    this.props.removeGeoLayers()
    this.props.removeUser()
  }

  public render() {
    let userRole: JSX.Element = <></>
    if (window.location.pathname.includes('/user/manager')) {
      userRole = <span id="userRole">Role: {this.props.auth.currentUser.role}</span>
    }

    if (this.props.auth.authenticated) {
      return (
        <>
          {userRole}
          <Button className="m-1" color="info" size="sm" onClick={() => this.handleLogout()}>
            Logout
          </Button>
        </>
      )
    } else {
      return (
        <div id="login-btns">
          <span className="login-title">Login with</span>
          <Button className="m-1" color="info" size="sm" onClick={this.handleLoginClick}>
            <i title="Gmail" className="fab fa-google fa-lg" />
          </Button>
          <Button className="m-1" color="info" size="sm" onClick={this.handleLoginClickGithub}>
            <i title="GitHub" className="fab fa-github fa-lg" />
          </Button>
        </div>
      )
    }
  }
}

function mapStateToProps(state: IRipplesState) {
  const auth = state.auth
  return { auth }
}

const actionCreators = {
  removeGeoLayers,
  removeUser,
  setToolSelected,
}

export default connect(mapStateToProps, actionCreators)(Login)
