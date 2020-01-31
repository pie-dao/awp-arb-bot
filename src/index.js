import BigNumber from 'bignumber.js';

import { apps } from '../ecosystem.config.js';
import { GasPrices } from './GasPrices.js';
import { Configuration } from './Configuration.js';
import { AWP } from './AWP.js';
import { Uniswap } from './Uniswap.js';

console.log('Configuring bot...');

const config = new Configuration(apps[0].env);

const {
  exchangeContract,
  network,
} = config;

const awp = new AWP(config);
const awpExchange = new Uniswap(config, config.exchangeAddress);
const daiExchange = new Uniswap(config, config.daiExchangeAddress);

const botAddress = config.walletAddress;

console.log('Configuration is', { network, botAddress });

const gas = new GasPrices(config);

let lastFastest;
let watcherPid;

const checkPrice = async (evt) => {
  console.log('Event', evt);

  const targetPrice = await awp.indexPrice();

  console.log('Target AWP++ Price', targetPrice.toFixed());

  const ethPrice = await daiExchange.tokenPrice();

  console.log('Eth price', ethPrice.toFixed());

  const awpPrice = BigNumber(1).dividedBy(await awpExchange.tokenPrice());

  console.log('AWP++ Price in ETH', awpPrice.toFixed());

  console.log('Target AWP++ Price in ETH', targetPrice.dividedBy(ethPrice).toFixed());

  const offset = awpPrice.dividedBy(targetPrice.dividedBy(ethPrice));

  console.log('Offset', offset.toFixed());

  if (offset.isGreaterThan(1.01) || offset.isLessThan(0.99)) {
    await awpExchange.arbitrate(targetPrice.dividedBy(ethPrice));
  }
};

const watcher = async () => {
  const { fastest } = gas;

  if (!fastest || fastest.isEqualTo(lastFastest)) {
    return;
  }

  lastFastest = fastest;
  // console.log(`Gas price (fastest): ${fastest.toString()}`);
};

// Initialization

const initWatcher = () => {
  watcherPid = setInterval(watcher, 250);
};

const stopWatcher = () => {
  clearInterval(watcherPid);
};

const main = async () => {
  stopWatcher();
  initWatcher();

  // listen to EthPurchase
  exchangeContract.on('EthPurchase', checkPrice);
  exchangeContract.on('TokenPurchase', checkPrice);

  checkPrice();
};

// startPid = setInterval(main, 30000);
main();
