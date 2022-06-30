# Functional Market Maker for FIN

This implements a simple market maker, based on [Hummingbot's Pure Market Making algorithm](https://master--docs-hb-v3.netlify.app/strategies/pure-market-making/)

## Getting Up and Running

### 1. Create and fund a wallet.

- The easiest way to get a wallet is to use the [Keplr](https://www.keplr.app/) browser extension and create a new account.
- Write down the seed phrase
- Transfer funds to this wallet either via IBC in Keplr, or bridge from EVM chains and exchanges at [https://blue.kujira.app/bridge](https://blue.kujira.app/bridge)

### 2. Configure the connection

`export MNEMONIC="your seed phrase from step one ..."`

`export RPC_ENDPOINT="https://rpc.kaiyo.kujira.setten.io"`

`export GAS_PRICE="0.00125ukuji"` (optional)

### 3. Configure markets and strategies

Option up `config.ts`. Currently this is set to only run on the FIN-DEMO pair on the `harpoon-4` testnet.

### 3. Tune the settings for the algorithm

Open up `src/strategies/pure_market_making.ts` and tweak the following params to suit your strategy.

```
// Space from mid price to orders in smallest amount of precision (currently hard-coded to 3 decimal places)
private TARGET_SPREAD = 10;

// Space between orders in smallest amount of precision (currently hard-coded to 3 decimal places)
private ORDER_GAP = 10;

// Total orders either side of the mid price
private ORDER_COUNT = 10;

// Total in quote denom
private ORDER_SIZE = 1 * 10 ** 6;

// ms delay between cycles
private FREQUENCY = 30000;
```

### 4. Start the Bot

Install deps `yarn`

There's a very basic run script in `yarn start`, but you will probably want to use your favourite method of keeping processes alive.

## TODO (pull requests welcome)

1. Variable strategy configuration per-market
1. Accommodate different precision types (different decimal places, and also significant figures)
1. Extract config to a .gitignored file and provide sample values
1. Better logging levels
