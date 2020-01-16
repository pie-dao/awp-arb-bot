import { getCurrentGasPrices } from './utils/getCurrentGasPrices.js';

export class GasPrices {
  constructor(config) {
    this.config = config;
    this.prices = {};
    this.stale = false;

    this.start();
  }

  get average() {
    return this.prices.average;
  }

  get fast() {
    return this.prices.fast;
  }

  get fastest() {
    return this.prices.fastest;
  }

  get running() {
    return !!this.pid;
  }

  get safeLow() {
    return this.prices.safeLow;
  }

  enqueue() {
    this.pid = setTimeout(() => this.fetch(), 500);
  }

  async fetch() {
    try {
      this.prices = await getCurrentGasPrices();
      this.stale = false;
    } catch (e) {
      console.error(e);
      this.stale = true;
    }

    this.enqueue();
  }

  start() {
    this.enqueue();
  }

  stop() {
    clearTimeout(this.pid);
    delete this.pid;
    this.prices = {};
    this.stale = false;
  }
}
