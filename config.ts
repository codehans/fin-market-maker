import { Connector } from "./src/connector";
import { PureMarketMaking } from "./src/strategies/pure_market_making";
import { Strategy } from "./src/strategies/strategy";

export type Config = {
  markets: {
    address: string;
    denoms: { base: string; quote: string };
    strategies: {
      new (
        address: string,
        connector: Connector,
        denoms: { base: string; quote: string }
      ): Strategy;
    }[];
  }[];
};

const config: Config = {
  markets: [
    {
      address:
        "kujira1suhgf5svhu4usrurvxzlgn54ksxmn8gljarjtxqnapv8kjnp4nrsqq4jjh",
      denoms: {
        quote: "factory/kujira1ltvwg69sw3c5z99c6rr08hal7v0kdzfxz07yj5/demo",
        base: "ukuji",
      },
      strategies: [PureMarketMaking],
    },
  ],
};

export default config;
