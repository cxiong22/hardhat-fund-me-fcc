// Deploy our fundMe constract by pulling in deployments object from Hardhat-deploy
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

// If true we are not on a development chain then skip
// If false we are not on a development chain the do describe()
// Unit test only run on development chains
!developmentChains.includes(network.name)
    ? describe.skip
    : // tests for the whole fundMe contract
      describe("FundMe", async function() {
          let fundMe
          let deployer
          let mockV3Aggregator
          // .parseEther() converts the 1 into 1000000000000000000
          const sendValue = ethers.utils.parseEther("1") // 1 ETH

          beforeEach(async function() {
              // deploy our fundMe contract using Hardhat-deploy
              // since using Hardhat-deploy, our fundMe contract will come with our mocks and everything

              // returns what is in the accounts section of our network
              // const accounts = await ethers.getSigners()
              // const accountZero = accounts[0]

              // getting deployer object to assigne to deployer
              deployer = (await getNamedAccounts()).deployer
              // deployments has function called "fixture" that lets us run our entire deploy folder with as many tags as we want
              /* Runs through our deploy scripts on our local network and deploy all
               * of the contracts so that we can use them in our scripts and in our
               * testing, we can deploy everything in that deploy folder with just
               * this line
               */
              await deployments.fixture(["all"])
              // once all of contracts are deployed, we can get them
              // .getContract() gets the most recent deployment of whatever contract we tell it
              // anytime we call a transaction with fundMe, the deployer is the account that is call that transaction
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          // tests only for the constructor functions
          describe("constructor", async function() {
              it("sets the aggregator addresses correctly", async function() {
                  // want to make sure this getPriceFeed() is same as our mockV3Aggregator by running these tests locally
                  // solidity compiler creates getter functions for every public variables
                  // succesful completion of this test means we are assigning the getPriceFeed address correctly to the MockV3Aggregator
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", async function() {
              it("Fails if you don't send enough ETH", async function() {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })
              it("updated the amount funded data structure", async function() {
                  await fundMe.fund({ value: sendValue })
                  // using deployer.address will give us the amount sent
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of getFunder", async function() {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })
          describe("withdraw", async function() {
              beforeEach(async function() {
                  await fundMe.fund({ value: sendValue })
              })

              it("withdraw ETH from a single founder", async function() {
                  // Arrange
                  /**FundMe contract comes with provider, could have done ethers.provider
                   * we are using fundMe.provider because we are using that contract but it doesn't reall matter much in this case
                   * we want to use the getBalance() function of provider which gets us the balance of any contract
                   */
                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  // Can get gas cost from transactionReceipt
                  // gasUsed * effectiveGasPrice = gasPayed, they are of BigNumber type in the debug console

                  // With this syntax we can pull objects out of another object
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  // both type BigNumber so using a function of that type to multiple
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // Asssert
                  assert.equal(endingFundMeBalance, 0)
                  // startingFundMeBalance is calling from the blockchain so its going to be of type BigNumber
                  // this is why we want to use .add() instead of +
                  // BigNumber is object so to test if they're both equal we will make them both strings
                  // spent gas when withdrawing so we need to calculate in the gas cost
                  assert.equal(
                      startingFundMeBalance.add(startingDeployerBalance)
                          .toString,
                      endingDeployerBalance.add(gasCost).toString
                  )
              })
              it("allows us to withdraw with multiple getFunder", async function() {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  // loop through each account and each call the fund function
                  // start with 1 because 0 account is going to be deployer
                  for (let i = 1; i < 6; i++) {
                      // Need to use connect() because fundMe contract is connected to our deployer account
                      // Need to create new objects to connect to these different accounts
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      // connected to different account
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance.add(startingDeployerBalance)
                          .toString,
                      endingDeployerBalance.add(gasCost).toString
                  )

                  // Make sure that the getFunder array are reset properly
                  /**We are making sure that after the deployer has withdrawn the funds,
                   * the getFunder array is reset and is empty.
                   * .to.be.reverted is saying that fundMe.getFunder(0) will fail since the getFunder
                   * array is reset and that will mean that there isn't an element at the 0th index.
                   * Expect for this error to occur
                   * This is to how we check the getFunder array is reset properly
                   */
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  // Loop through all these accounts to make sure that in our mapping of,
                  // getAddressToAmountFunded, that all of the amounts are 0
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("Only allows the owner to withdraw", async function() {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  // When another account tries to withdraw, it is autmoatically reverted
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })

              it("cheaperWithdraw...", async function() {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  // loop through each account and each call the fund function
                  // start with 1 because 0 account is going to be deployer
                  for (let i = 1; i < 6; i++) {
                      // Need to use connect() because fundMe contract is connected to our deployer account
                      // Need to create new objects to connect to these different accounts
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      // connected to different account
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance.add(startingDeployerBalance)
                          .toString,
                      endingDeployerBalance.add(gasCost).toString
                  )

                  // Make sure that the getFunder array are reset properly
                  /**We are making sure that after the deployer has withdrawn the funds,
                   * the getFunder array is reset and is empty.
                   * .to.be.reverted is saying that fundMe.getFunder(0) will fail since the getFunder
                   * array is reset and that will mean that there isn't an element at the 0th index.
                   * Expect for this error to occur
                   * This is to how we check the getFunder array is reset properly
                   */
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  // Loop through all these accounts to make sure that in our mapping of,
                  // getAddressToAmountFunded, that all of the amounts are 0
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
          })
      })
