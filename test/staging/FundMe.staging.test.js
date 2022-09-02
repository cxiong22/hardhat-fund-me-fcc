const { getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert } = require("chai")

// If true we are on a development chain then skip
// If false we are on then do the describe()
// Staging test only runs on test nets
developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe Staging Tests", async function() {
          let fundMe
          let deployer
          const sendValue = ethers.utils.parseEther("0.1")
          beforeEach(async function() {
              // We are not going to deploy this and do any fixtures like in the unit tests
              // In the staging tests we are assuming that its already deployed here
              // Also don't need a mock because, on staging tests, we are assuming we on a test net
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })

          it("allows people to fund and withdraw", async function() {
              const fundTxResponse = await fundMe.fund({ value: sendValue })
              await fundTxResponse.wait(1)
              const withdrawTxResponse = await fundMe.withdraw()
              await withdrawTxResponse.wait(1)

              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              console.log(
                  endingBalance.toString() +
                      " should equal 0, running assert equal..."
              )
              assert.equal(endingBalance.toString(), "0")
          })
      })
