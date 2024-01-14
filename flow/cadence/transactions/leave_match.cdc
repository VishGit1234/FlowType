import Match from "../contracts/match.cdc"

transaction() {

  prepare(acct: AuthAccount) {
  }

  execute {
    Match.leaveMatch()
  }
}
