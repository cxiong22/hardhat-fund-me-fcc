// import
// main function
// calling of main function

// There are 3 different ways to write the same thing below

// asyc function deployFunc(hre) {
//     hre.getNamedAccounts()
//     hre.deployments
// }
// module.exports.default = deployFunc

// module.exports = async (hre) => {
//     const {getNamedAccounts, deployments} = hre
// hre.getNamedAccounts         these two are whats in the const
// hre.deployments

/**This is another way of writing what's below
 * const helpConfig = require("../helper-hardhat-config")
 * const networkConfig = helpConfig.networkConfig
 */
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { getNamedAccounts, deployments, network } = require("hardhat")
const { verify } = require("../utils/verify")

// we are using this deployments object to get two functions
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    // if the contract doesn't exist, we deploya minimal version of it for our local testing

    // well what happens when we want to change chains?
    // when going for localhoast or hardhat network we want to use a mock
    // We don't need contractFactories to deploy, with hardhat-deploy we can just use its deploy function
    log("----------------------------------------------------------")
    log("Deploying FundMe and waiting for confirmations...")
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, // put priceFeed address
        log: true, // shows in console transaction address and more info
        waitConfirmations: network.config.blockConfirmations || 1
    })
    log(`FundMe deployed at ${fundMe.address}`)

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args)
    }
    log("------------------------------------------------------")
}
module.exports.tags = ["all", "fundme"]
