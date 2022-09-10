const { run } = require("hardhat")

const verify = async (contractAddress, args) => {
    console.log("Verifying contract...")
    console.log(contractAddress)
    console.log(args)

    /* We are using the try catch because if there is an error, the verification
    function will break and the whole script will end. We don't want the whole
    script to end. We want the script to keep continuing if the verification
    doesn't work because it's not a big deal. */
    // the second verify is a subtask of the verify task
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args
        })
        // the "e" is any error that the try section throws
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already Verified!")
        } else {
            console.log(e)
        }
    }
}

module.exports = { verify }
