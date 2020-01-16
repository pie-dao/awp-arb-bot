import BigNumber from 'bignumber.js';
import fetch from 'node-fetch';

export const getCurrentGasPrices = async () => {
  const result = await fetch('https://ethgasstation.info/json/ethgasAPI.json');
  const {
    fastest,
    fast,
    average,
    safeLow,
  } = await result.json();

  return {
    average: new BigNumber(average).div(10),
    fast: new BigNumber(fast).div(10),
    fastest: new BigNumber(fastest).div(10),
    safeLow: new BigNumber(safeLow).div(10),
  };
};
