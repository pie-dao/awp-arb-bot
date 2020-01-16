import fetch from 'node-fetch';
import BigNumber from 'bignumber.js';

const STOCKS = [
  'GLD',
  'GSG',
  'IEI',
  'TLT',
  'VTI',
];

export class AWP {
  constructor(config) {
    this.config = config;
  }

  get url() {
    return this.config.apiUrl;
  }

  async indexPrice() {
    const { assets } = await fetch(`${this.url}/portfolio/awp+++`).then(r => r.json());
    console.log(assets);
    let price = BigNumber(0);

    await Promise.all(
      assets.map(async (data) => {
        const { ratio, ticker } = data;
        const initialPrice = data.initial_price;
        const path = STOCKS.includes(ticker) ? 'stock' : 'crypto';
        const { close } = await fetch(`${this.url}/${path}/${ticker}/now`).then(r => r.json());

        price = price.plus(BigNumber(close).dividedBy(initialPrice).multipliedBy(ratio));
      }),
    );

    return price;
  }
}
