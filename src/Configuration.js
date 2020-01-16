import { ethers } from 'ethers';

import { erc20Generic } from './abi/erc20Generic.js';
import { uniswapExchange } from './abi/uniswapExchange.js';
import { validateHexString } from './utils/validateHexString.js';

class MissingConfigError extends Error {}

const fetchConfig = (name, fallback, hex = false) => {
  if (!process.env[name] && !fallback) {
    const message = `Missing required config ENV var ${name}`;
    throw new MissingConfigError(message);
  }

  if (hex) {
    return validateHexString(process.env[name] || fallback);
  }

  return process.env[name] || fallback;
};

export class Configuration {
  constructor(overrides = {}) {
    this.apiUrl = fetchConfig('apiUrl', overrides.API_URL);
    this.daiExchangeAddress = fetchConfig(
      'DAI_EXCHANGE_ADDRESS',
      overrides.DAI_EXCHANGE_ADDRESS,
      true,
    );
    this.erc20Contracts = {};
    this.exchangeAddress = fetchConfig('EXCHANGE', overrides.EXCHANGE, true);
    this.network = fetchConfig('NETWORK', overrides.NETWORK || 'homestead');
    this.privateKey = fetchConfig('PRIVATE_KEY', overrides.PRIVATE_KEY);
    this.provider = overrides.provider || ethers.getDefaultProvider(this.network);
    this.wallet = new ethers.Wallet(this.privateKey, this.provider);
    this.uniswapContracts = {};

    this.signer = this.signer.bind(this);
  }

  get daiExchangeContract() {
    return this.uniswapContract(this.daiExchangeAddress);
  }

  get exchangeContract() {
    return this.uniswapContract(this.exchangeAddress);
  }

  get walletAddress() {
    return this.wallet.address.toLowerCase();
  }

  erc20Contract(address) {
    if (this.erc20Contracts[address]) {
      return this.erc20Contracts[address];
    }

    this.erc20Contracts[address] = new ethers.Contract(address, erc20Generic, this.wallet);

    return this.erc20Contracts[address];
  }

  signer(data) {
    return this.wallet.signMessage(data);
  }

  uniswapContract(address) {
    if (this.uniswapContracts[address]) {
      return this.uniswapContracts[address];
    }

    this.uniswapContracts[address] = new ethers.Contract(address, uniswapExchange, this.wallet);

    return this.uniswapContracts[address];
  }
}

export default Configuration;
