import { Coin, coins } from "@cosmjs/stargate";
import { FinQueryClient } from "kujira.js";
import { OrderResponse } from "kujira.js/lib/cjs/fin";
import { Connector } from "../connector";
import { Strategy } from "./strategy";

export class PureMarketMaking extends Strategy {
  // Space from mid price to orders in smallest amount of precision
  private TARGET_SPREAD = 10;

  // Space between orders in smallest amount of precision
  private ORDER_GAP = 10;

  //   Total orders either side of the mid price
  private ORDER_COUNT = 10;

  //   Total in quote denom
  private ORDER_SIZE = 1 * 10 ** 6;

  //  ms delay between cycles
  private FREQUENCY = 30000;

  private contract: FinQueryClient;
  constructor(
    address: string,
    connector: Connector,
    denoms: { base: string; quote: string }
  ) {
    super(address, connector, denoms);
    this.contract = new FinQueryClient(connector.cwClient, address);
  }
  run = async (): Promise<void> => {
    console.log(`PureMarketMaking: ${this.address}`);

    const [{ orders }, { base, quote }] = await Promise.all([
      this.contract.ordersByUser({
        address: this.connector.account.address,
        limit: 30,
      }),
      this.contract.book({ limit: 1 }),
    ]);
    const buy = parseFloat(base[0].quote_price);
    const sell = parseFloat(quote[0].quote_price);

    const midPrice = parseFloat(((buy + sell) / 2).toFixed(3));

    const buyInt = Math.round(buy * 10 ** 3);
    const buyRange = [...new Array(this.ORDER_COUNT)]
      .map((x, idx) => buyInt - this.ORDER_GAP * (idx + this.TARGET_SPREAD))
      .map((x) => x / 10 ** 3);

    const sellInt = Math.round(buy * 10 ** 3);
    const sellRange = [...new Array(this.ORDER_COUNT)]
      .map((x, idx) => sellInt + this.ORDER_GAP * (idx + this.TARGET_SPREAD))
      .map((x) => x / 10 ** 3);

    const buyOrders = orders.filter(
      (o) => parseFloat(o.quote_price) < midPrice
    );
    const sellOrders = orders.filter(
      (o) => parseFloat(o.quote_price) > midPrice
    );
    const i: [typeof orders, typeof orders] = [[], []];
    const [matchingBuyOrders, discardBuyOrders] = buyOrders.reduce(
      ([a, b], o) =>
        buyRange.includes(parseFloat(o.quote_price))
          ? [[...a, o], b]
          : [a, [...b, o]],
      i
    );

    const submitBuyOrders = buyRange.reduce((a, p) => {
      const e = matchingBuyOrders.find((o) => parseFloat(o.quote_price) === p);
      //   Let's just ignore for now. TODO: top up and then compile all matching orders in future runs
      if (e) return a;
      return [...a, { quote_price: p, amount: this.ORDER_SIZE }];
    }, [] as { quote_price: number; amount: number }[]);

    const [matchingSellOrders, discardSellOrders] = sellOrders.reduce(
      ([a, b], o) =>
        sellRange.includes(parseFloat(o.quote_price))
          ? [[...a, o], b]
          : [a, [...b, o]],
      i
    );

    const submitSellOrders = sellRange.reduce((a, p) => {
      const e = matchingSellOrders.find((o) => parseFloat(o.quote_price) === p);
      //   Let's just ignore for now. TODO: top up and then compile all matching orders in future runs
      if (e) return a;
      return [
        ...a,
        { quote_price: p, amount: Math.floor(this.ORDER_SIZE / midPrice) },
      ];
    }, [] as { quote_price: number; amount: number }[]);

    console.log(`MID: ${midPrice}`);

    console.log("BUY");
    console.log(
      `  existing: ${buyOrders.map((a) => a.quote_price).join(", ")}`
    );
    console.log(
      `  matching: ${matchingBuyOrders.map((a) => a.quote_price).join(", ")}`
    );
    console.log(
      `  discard: ${discardBuyOrders.map((a) => a.quote_price).join(", ")}`
    );
    console.log(
      `  submit: ${submitBuyOrders.map((a) => a.quote_price).join(", ")}`
    );

    console.log("SELL");
    console.log(
      `  existing: ${sellOrders.map((a) => a.quote_price).join(", ")}`
    );
    console.log(
      `  matching: ${matchingSellOrders.map((a) => a.quote_price).join(", ")}`
    );
    console.log(
      `  discard: ${discardSellOrders.map((a) => a.quote_price).join(", ")}`
    );
    console.log(
      `  submit: ${submitSellOrders.map((a) => a.quote_price).join(", ")}`
    );

    const msgs = [
      this.retractOrders([...discardBuyOrders, ...discardSellOrders]),
      this.withdrawOrders(orders.filter((x) => parseInt(x.filled_amount) > 0)),
      ...submitSellOrders.map((o) =>
        this.submitOrder({
          price: o.quote_price,
          funds: coins(o.amount, this.denoms.base),
        })
      ),
      ...submitBuyOrders.map((o) =>
        this.submitOrder({
          price: o.quote_price,
          funds: coins(o.amount, this.denoms.quote),
        })
      ),
    ];
    await this.connector.signAndBroadcast(msgs);
    await new Promise((r) => setTimeout(r, this.FREQUENCY));

    return this.run();
  };

  withdrawOrders = (orders: OrderResponse[]) =>
    this.connector.msgExecuteContract(
      this.address,
      { withdraw_orders: { order_idxs: orders.map((o) => o.idx) } },
      []
    );

  retractOrders = (orders: OrderResponse[]) =>
    this.connector.msgExecuteContract(
      this.address,
      { retract_orders: { order_idxs: orders.map((o) => o.idx) } },
      []
    );

  submitOrder = ({ price, funds }: { price: number; funds: Coin[] }) =>
    this.connector.msgExecuteContract(
      this.address,
      { submit_order: { price: price.toString() } },
      funds
    );
}
