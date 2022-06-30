import {
  AccountData,
  Coin,
  DirectSecp256k1HdWallet,
  EncodeObject,
} from "@cosmjs/proto-signing";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { SigningStargateClient } from "@cosmjs/stargate";
import { tx } from "kujira.js";

export class Connector {
  constructor(
    private signer: DirectSecp256k1HdWallet,
    private signingClient: SigningStargateClient,
    public account: AccountData,
    public cwClient: CosmWasmClient
  ) {}

  msgExecuteContract = (contract: string, msg: object, funds: Coin[]) =>
    tx.wasm.msgExecuteContract({
      sender: this.account.address,
      contract,
      msg: Buffer.from(JSON.stringify(msg)),
      funds,
    });
  signAndBroadcast = (msgs: EncodeObject[]) =>
    this.signingClient.signAndBroadcast(this.account.address, msgs, "auto");
}
