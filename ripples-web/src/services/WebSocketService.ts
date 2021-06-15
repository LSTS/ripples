import { Client, Message } from '@stomp/stompjs'

const WEB_SOCKETS_URL = process.env.REACT_APP_WS_URL

export default class WSService {
  private client: Client = new Client()

  public createWSClient() {
    this.client = new Client({
      brokerURL: WEB_SOCKETS_URL,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    })
    this.client.onStompError = (frame) => {
      // Will be invoked in case of error encountered at Broker
      alert('Broker reported error: ' + frame.headers.message)
      alert('Additional details: ' + frame.body)
    }
  }

  public subscribeWSUpdates(
    assetHandler: (m: Message) => any,
    aisHandler: (m: Message) => any,
    annotationHandler: (m: Message) => any,
    userLocationHandler: (m: Message) => any,
    vehicleParamsHandler: (m: Message) => any,
    pollutionHandler: (m: Message) => any,
    obstacleHandler: (m: Message) => any
  ) {
    this.client.onConnect = (frame) => {
      // Do something, all subscribes must be done is this callback
      // This is needed because this will be executed after a (re)connect
      this.client.subscribe('/topic/asset', assetHandler)
      this.client.subscribe('/topic/ais', aisHandler)
      this.client.subscribe('/topic/logbook', annotationHandler)
      this.client.subscribe('/topic/users/location', userLocationHandler)
      this.client.subscribe('/topic/assets/params', vehicleParamsHandler)
      this.client.subscribe('/topic/pollution', pollutionHandler)
      this.client.subscribe('/topic/obstacle', obstacleHandler)
    }
  }

  public deactivate() {
    this.client.deactivate()
  }

  public activate() {
    this.client.activate()
  }
}
