import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice, SigningStargateClient } from "@cosmjs/stargate";
import { registry } from "kujira.js";
import config from "./config";
import { Connector } from "./src/connector";

console.log("RUN");

async function load(): Promise<Connector> {
  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic) throw new Error("MNEMONIC not set");

  const rpc = process.env.RPC_ENDPOINT;
  if (!rpc) throw new Error("RPC_ENDPOINT not set");

  const gasPrice = process.env.GAS_PRICE || "0.00125ukuji";

  const signer = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: "kujira",
  });

  const accounts = await signer.getAccounts();
  const account = accounts[0];

  const signingClient = await SigningStargateClient.connectWithSigner(
    rpc,
    signer,
    { registry, gasPrice: GasPrice.fromString(gasPrice) }
  );

  const cwClient = await CosmWasmClient.connect(rpc);

  return new Connector(signer, signingClient, account, cwClient);
}

async function run(connector: Connector) {
  Promise.all(
    config.markets.map((m) => {
      Promise.all(
        m.strategies.map((s) => {
          const strategy = new s(m.address, connector, m.denoms);
          return strategy.run();
        })
      );
    })
  );

  console.log("RUNNING");
  //   run();
}

load().then(run);
