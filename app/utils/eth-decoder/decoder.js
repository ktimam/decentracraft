// import { Interface } from "ethers/utils/interface"
const Interface = require("ethers/utils/interface")

exports.Decoder =  class Decoder {
  constructor(abis = []) {
    this._interfaces = []
    abis.forEach(abi => {
      const methodInterface = new Interface(abi)
      this._interfaces.push(methodInterface)
    })
  }

  getInterfaces() {
    return this._interfaces
  }
}
