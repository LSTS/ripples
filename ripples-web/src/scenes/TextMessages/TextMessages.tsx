import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Table } from 'reactstrap'
import SimpleNavbar from '../../components/SimpleNavbar'
import IAuthState, { IUser } from '../../model/IAuthState'
import IRipplesState from '../../model/IRipplesState'
import ITextMessage from '../../model/ITextMessage'
import DateService from '../../services/DateUtils'
import hexToAscii from '../../services/HexToAscii'
import { fetchTextMessages } from '../../services/Rock7Utils'
import { setUser } from '../../redux/ripples.actions'
import { getCurrentUser } from '../../services/UserUtils'
const { NotificationManager } = require('react-notifications')

interface StateType {
  messages: ITextMessage[]
  isNavOpen: boolean
}

interface PropsType {
  setUser: (user: IUser) => any
  auth: IAuthState
}

/**
 * Display iridium / rock7 plain text messages
 */
export class TextMessages extends Component<PropsType, StateType> {
  public notificationSystem: any = null
  public timerID: number = 0

  constructor(props: any) {
    super(props)
    this.state = {
      isNavOpen: true,
      messages: [],
    }
    this.updateMessages = this.updateMessages.bind(this)
    this.loadCurrentlyLoggedInUser = this.loadCurrentlyLoggedInUser.bind(this)
  }

  public async loadCurrentlyLoggedInUser() {
    try {
      const user: IUser = await getCurrentUser()
      this.props.setUser(user)
    } catch (error) {
      localStorage.removeItem('ACCESS_TOKEN')
    }
  }

  public async componentDidMount() {
    await this.loadCurrentlyLoggedInUser()
    this.updateMessages()
    this.timerID = window.setInterval(this.updateMessages, 60000)
  }

  public componentWillUnmount() {
    clearInterval(this.timerID)
  }

  public onNavToggle() {
    this.setState({ isNavOpen: !this.state.isNavOpen })
  }

  public updateMessages() {
    fetchTextMessages()
      .then((data) => {
        const messages = data.map((m: any) =>
          Object.assign({}, m, {
            date: DateService.timestampMsToReadableDate(m.updated_at),
            msg: hexToAscii(m.msg),
          })
        )
        this.setState({ messages: messages.reverse() })
      })
      .catch((_) => {
        NotificationManager.warning('Failed to fetch text messages')
      })
  }

  public renderMessage(textMsg: ITextMessage) {
    return (
      <tr key={textMsg.updated_at}>
        <td>{textMsg.date}</td>
        <td>{textMsg.msg}</td>
      </tr>
    )
  }

  public renderMessages() {
    return this.state.messages.map((msg) => this.renderMessage(msg))
  }
  public render() {
    return (
      <>
        <SimpleNavbar />
        <div>
          <Table responsive={true}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Content</th>
              </tr>
            </thead>
            <tbody>{this.renderMessages()}</tbody>
          </Table>
        </div>
      </>
    )
  }
}

function mapStateToProps(state: IRipplesState) {
  return {
    auth: state.auth,
  }
}

const actionCreators = {
  setUser,
}

export default connect(mapStateToProps, actionCreators)(TextMessages)
