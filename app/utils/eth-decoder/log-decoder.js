// import Decoder from "./decoder"
// const Decoder = require("./decoder");
const ethers = require('ethers');
const Interface = require("ethers/utils/interface")

exports.LogDecoder = class LogDecoder /* extends Decoder */ {
  
  constructor(abis = []) {
    ethers.errors.setLogLevel("error")

    this._interfaces = []
    abis.forEach(abi => {
      const methodInterface = new Interface.Interface(abi)
      this._interfaces.push(methodInterface)
    })
  }

  getInterfaces() {
    return this._interfaces
  }

  decodeLogs(logs = []) {
    return logs.map(log => {
      for (let i = 0; i < this._interfaces.length; i++) {
        const iface = this._interfaces[i]
        try {
          const parsedLog = iface.parseLog(log)
          if (parsedLog) {
            return {
              // parsedArgs,
              address: log.address.toLowerCase(),
              ...parsedLog,
              event: parsedLog.name,
              args: parsedLog.values
            }
          }
        } catch (e) {
          // ignore
        }
      }

      //throw new Error("Log doesn't match")
    })
  }
}
