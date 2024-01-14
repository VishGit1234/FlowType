pub contract Match {

  pub var isOpen: Bool
  pub var connectedClients: {Address:Int}
  pub var numClients: Int
  pub var winningClientAddress: Address
  

  pub fun joinMatch() {
    if self.isOpen == true{
      self.connectedClients.insert(key: self.account.address, 0)
      self.numClients = self.numClients + 1
      if self.numClients > 1 {
        self.isOpen = false
      }
    }
  }

  pub fun leaveMatch(timeScore: Int){
    self.connectedClients[self.account.address] = timeScore
    self.numClients = self.numClients - 1
    if(self.numClients == 0){
      self.winningClientAddress = self.account.address
      for key in self.connectedClients.keys{
        if self.connectedClients[key]! > self.connectedClients[self.winningClientAddress]!{
            self.winningClientAddress = key
        }
      }
      self.isOpen = true
    }
  }

  pub fun clearMatch(){
    if(self.account.address == self.winningClientAddress)
    {
      for key in self.connectedClients.keys{
        self.connectedClients.remove(key: key)
      }
    }
  }

  init() {
    self.isOpen = true
    self.connectedClients = {}
    self.numClients = 0
    self.winningClientAddress = Address(0x1)
  }
}
