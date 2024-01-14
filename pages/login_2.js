import { useEffect, useState } from 'react';
// import styles from '../styles/Home.module.css'
import * as fcl from "@onflow/fcl";
import "../flow/config.js";
import styles from '../styles/Home.module.css'
import Typer from './components/typer.js';

export default function Login_2() {
  const [user, setUser] = useState({ loggedIn: false });
  const [balance, setBalance] = useState('0.0');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  // This keeps track of the logged in 
  // user for you automatically.
  useEffect(() => {
    fcl.currentUser().subscribe(setUser);
  }, [])

  async function getBalance() {

    const result = await fcl.query({
      cadence: `
      import FungibleToken from 0xStandard
      import ExampleToken from 0xDeployer

      pub fun main(account: Address): UFix64 {
          let vaultRef = getAccount(account).getCapability(ExampleToken.VaultBalancePath)
                          .borrow<&ExampleToken.Vault{FungibleToken.Balance}>()
                          ?? panic("Could not borrow Balance reference to the Vault")

          return vaultRef.balance
      }
      `,
      args: (arg, t) => [
        arg(user?.addr, t.Address)
      ]
    });

    setBalance(result);
  }

  async function transferTokens(amount, recipient) {

    const transactionId = await fcl.mutate({
      cadence: `
      import FungibleToken from 0xStandard
      import ExampleToken from 0xDeployer

      transaction(amount: UFix64, recipient: Address) {
        let SentVault: @FungibleToken.Vault
        prepare(signer: AuthAccount) {
            let vaultRef = signer.borrow<&ExampleToken.Vault>(from: ExampleToken.VaultStoragePath)
                              ?? panic("Could not borrow reference to the owner's Vault!")

            self.SentVault <- vaultRef.withdraw(amount: amount)
        }

        execute {
            let receiverRef = getAccount(recipient).getCapability(ExampleToken.VaultReceiverPath)
                                .borrow<&ExampleToken.Vault{FungibleToken.Receiver}>()
                                ?? panic("Could not borrow receiver reference to the recipient's Vault")

            receiverRef.deposit(from: <-self.SentVault)
        }
      }
      `,
      args: (arg, t) => [
        arg(parseFloat(amount).toFixed(2), t.UFix64),
        arg(recipient, t.Address)
      ],
      proposer: fcl.authz,
      payer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 999
    });

    console.log('Transaction Id', transactionId);
  }

  async function setupVault() {

    const transactionId = await fcl.mutate({
      cadence: `
      import FungibleToken from 0xStandard
      import ExampleToken from 0xDeployer

      transaction() {

        prepare(signer: AuthAccount) {
          /* 
            NOTE: In any normal DApp, you would NOT DO these next 3 lines. You would never want to destroy
            someone's vault if it's already set up. The only reason we do this for the
            tutorial is because there's a chance that, on testnet, someone already has 
            a vault here and it will mess with the tutorial.
          */
          destroy signer.load<@FungibleToken.Vault>(from: ExampleToken.VaultStoragePath)
          signer.unlink(ExampleToken.VaultReceiverPath)
          signer.unlink(ExampleToken.VaultBalancePath)

          // These next lines are the only ones you would normally do.
          if signer.borrow<&ExampleToken.Vault>(from: ExampleToken.VaultStoragePath) == nil {
              // Create a new ExampleToken Vault and put it in storage
              signer.save(<-ExampleToken.createEmptyVault(), to: ExampleToken.VaultStoragePath)

              // Create a public capability to the Vault that only exposes
              // the deposit function through the Receiver interface
              signer.link<&ExampleToken.Vault{FungibleToken.Receiver}>(ExampleToken.VaultReceiverPath, target: ExampleToken.VaultStoragePath)

              // Create a public capability to the Vault that only exposes
              // the balance field through the Balance interface
              signer.link<&ExampleToken.Vault{FungibleToken.Balance}>(ExampleToken.VaultBalancePath, target: ExampleToken.VaultStoragePath)
          }
        }
      }
      `,
      args: (arg, t) => [],
      proposer: fcl.authz,
      payer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 999
    });

    console.log('Transaction Id', transactionId);
  }

  async function joinGame() {
    const temp = await fcl.mutate({
        cadence: `
        import Match from 0xAnother

        transaction() {

            prepare(acct: AuthAccount) {
            }

            execute {
                Match.joinMatch()
            }
        }
        `
    })
  }

  async function leaveMatch(timescore) {
    const temp = await fcl.mutate({
        cadence: `
        import Match from 0xAnother

        transaction() {
        
          prepare(acct: AuthAccount) {
          }
        
          execute {
            Match.leaveMatch()
          }
        }
        `,
        timeScore: timescore
    })
  }

  async function isMatchDone() {
    const isOpen = await fcl.query({
        cadence: `
        import Match from 0xAnother

        pub fun main(): Bool {
            return Match.isOpen
        }
        `
    })
    return isOpen
  }

  async function clearMatch(timescore) {
    const temp = await fcl.mutate({
        cadence: `
        import Match from 0xAnother

        transaction() {
        
          prepare(acct: AuthAccount) {
          }
        
          execute {
            Match.clearMatch()
          }
        }
        
        `,
        timeScore: timescore
    })
  }

  async function getWinner() {
    const isOpen = await fcl.query({
        cadence: `
        import Match from 0xAnother

        pub fun main(): Address {
            return Match.winningClientAddress
        }
        `
    })
    return isOpen
  }

  const matchStart = () => {
    joinGame()
  }
  

  const matchDone = async () => {
    await leaveMatch()
    const intervalId = setInterval(async () => {
        const matchOpen = await isMatchDone()
        if(matchOpen){
            const winnerAddress = await getWinner()
            if (user.Address != winnerAddress)
            {
                await transferTokens(2, winnerAddress)
            }
            else{
                await clearMatch
            }
            // console.log(String(winnerAddress))
            clearInterval(intervalId)
        }
    }, 3000)
  }

  return (
//     <div className="flex items-center justify-center pt-20">
//     <div className="bg-white p-10 rounded-lg shadow-lg w-1/2">
//     <h2 className="text-3xl font-bold mb-6">Flow Login</h2>

//     <form>
//       {/* <div className="mb-4">
//         <label for="username" className="block text-sm font-medium text-gray-600">Username</label>
//         <input type="text" id="username" name="username" className="mt-1 p-2 w-full border rounded-md" />
//       </div> */}

//       <div className="mb-6">
//         {!user.loggedIn ? <button onClick={fcl.authenticate} className="w-full p-4 bg-blue-500 text-white rounded-md text-lg">Connect</button> :
//         <button onClick={fcl.unauthenticate} className="w-full p-4 bg-blue-500 text-white rounded-md text-lg">Disconnect</button>
//         }
//       </div>
//     </form>
//   </div>
//   </div>
    <div className='bg-darkslate flex flex-col min-h-screen'>
      <main className='container mx-auto flex-1 p-5'>
        <div className='mb-5 flex justify-between items-center pr-10 pt-2'>
          <h1 className='text-[#d1d5db] text-xl'>FlowType</h1>
          <div className='flex space-x-4 items-center'>
            <h1 className='text-[#d1d5db] text-xl'>Address: </h1>
            <h1 className='border px-7 text-center text-[#d1d5db] text-lg py-1 rounded-xl border-[#d1d5db] w-75'>{user.loggedIn ? user.addr : "Please connect wallet -->"}</h1>
          </div>
          <div>{!user.loggedIn ? <button className='border rounded-xl border-[#d1d5db] px-5 text-xl text-[#d1d5db] py-1 hover:bg-[#d1d5db] hover:text-[#020617]'
            onClick={fcl.authenticate}>Connect</button> : <button className='border rounded-xl border-[#d1d5db]
          px-5 text-lg text-[#d1d5db] py-1 hover:bg-[#d1d5db] hover:text-[#020617]' onClick={fcl.unauthenticate}>Logout</button>}
          </div>
        </div>
        <hr className='border-[#d1d5db]' />
        {!user.loggedIn ? '' : <div className='flex pt-5 px-20 justify-between'>
          <button onClick={setupVault} className='rounded-lg px-9 py-2 text-blue-900 font-bold text-sm bg-[#38E8C6]'>Setup Vault</button>
          <div className='flex items-center '>
            <button className='text-[#38E8C6] text-lg px-2'>Balance :</button>
            <h2 className='rounded-lg bg-[#00344B] text-gray-300 py-2 px-6'>{balance}</h2>
            <svg xmlns="http://www.w3.org/2000/svg" onClick={getBalance} className="h-7 w-7 cursor-pointer pl-2" fill="none" viewBox="0 0 24 24" stroke="#38E8C6" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>
        }
        <div className='flex flex-col items-center text-white justify-center pt-28'>
          {!user.loggedIn ? <div className='flex flex-col justify-center items-center'>
            <img src='/whistle.svg' width={200} alt='nothing to see here' />
            <h1 className='pt-5 font-semibold text-[#d1d5db]'>Nothing to see here. Please connect to your wallet.</h1>
          </div>
            : <Typer matchDone={matchDone} matchStart={matchStart}/>}
        </div>
      </main>
      <footer>
        <div className='bg-black flex pt-10 pb-5 justify-center text-white'>
          <div className='flex  items-center'> 
            <h1 className='flex items-center text-[#d1d5db] hover:underline hover:underline-offset-2 space-x-1 font-poppins text-lg'>
                FlowType
            </h1>
             </div>
        </div>
      </footer>
    </div>

  )
}


