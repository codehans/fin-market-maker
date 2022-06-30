import { Connector } from "../connector";

export interface IStrategy {
  waitTime: () => number;
  run: () => Promise<void>;
}

export class Strategy {
  constructor(
    protected address: string,
    protected connector: Connector,
    protected denoms: { base: string; quote: string }
  ) {}
  run = async () => {};
}
