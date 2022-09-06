require("@nomicfoundation/hardhat-toolbox")
require("hardhat-deploy")
require("dotenv").config()
require("@nomiclabs/hardhat-etherscan")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("@nomiclabs/hardhat-waffle")

const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL || ""
const PRIVATE_KEY = process.env.PRIVATE_KEY || ""
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || ""

module.exports = {
    // compiling multiple versions of solidity
    solidity: {
        compilers: [{ version: "0.8.8" }, { version: "0.6.6" }]
    },
    defaultNetwork: "hardhat",
    networks: {
        rinkeby: {
            url: RINKEBY_RPC_URL || "",
            accounts: [PRIVATE_KEY],
            chainId: 4,
            blockConfirmations: 6,
            allowUnlimitedContractSize: true,
            gas: 5000000,
            gasPrice: 8000000000,
        }
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY
    },
    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD"
        // makes an API call to coinmarketcap whenever we run gas reporter
        // coinmarketcap: COINMARKETCAP_API_KEY,
        // token: "MATIC" // use this to see price with Matic Polygon
    },
    namedAccounts: {
        deployer: {
            default: 0, // the 0th account is going to be deployer
            1: 0
            // Can specify which number is going to be deployer account across different chains
            // "4: 1" tells deployer account to be in 1st position in rinkeby or "313317: 1" for hardhat
        }
        // can create multiple users for like tests or something
    },
    mocha: {
        timeout: 500000
    }
}
