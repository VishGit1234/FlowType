import Match from "../contracts/match.cdc"

pub fun main(): {Address:Int} {
    return Match.connectedClients
}