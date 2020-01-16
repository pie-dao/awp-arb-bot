import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

const getTimeStamp = (offset = 0) => BigNumber(Math.floor(Date.now() / 1000) + offset).toNumber();

export class Uniswap {
  constructor(config, exchangeAddress) {
    this.config = config;
    this.exchangeAddress = exchangeAddress;
  }

  get contract() {
    return this.config.uniswapContract(this.exchangeAddress);
  }

  async ethBalance() {
    return BigNumber((await this.config.provider.getBalance(this.exchangeAddress)).toString());
  }

  async arbitrate(feedPrice) {
    // get the number of tokens that should be paired to each eth
    // const targetTokensPerETH = BigNumber(1).dividedBy(targetPrice);
    // const currentTokensPerETH = await this.tokenPrice();
    // const tokensPerETHDelta = targetTokensPerETH.subtract(currentTokensPerETH);

    // if (tokensPerETHDelta.isGreaterThan(0)) {
    // get the current amount of eth
    const ethBalance = await this.ethBalance();
    const tokenBalance = await this.tokenBalance();

    // https://github.com/MickdeGraaf/defied/blob/master/utils/src/index.ts#L73
    const largeNumber = new BigNumber(10000000000000000000000);

    const k = ethBalance.multipliedBy(tokenBalance);

    const priceUniswap = ethBalance.div(tokenBalance);
    console.log(`Token price in ETH on uniswap is ${priceUniswap.toString()}`);

    console.log(`Token price in ETH in feed is ${feedPrice.toString()}`);

    // price: 1.5625; constant: 10000
    // a = square_root(1.5625 * 10000)
    // a = 125
    // b = 125 / 1.5625
    // b = 80

    const a = feedPrice.multipliedBy(k).squareRoot();
    const b = a.dividedBy(feedPrice);

    console.log(`Target ETH = ${a.toString()}`);
    console.log(`Target TOKEN = ${b.toString()}`);
    console.log(`Target price = ${a.dividedBy(b)}`);


    try {
      if (a.gt(ethBalance)) { // If eth amount needs to go up buy some tokens
        const overrides = {
          gasLimit: 200000,
          gasPrice: ethers.utils.parseUnits('30', 'gwei'),
          value: a.minus(ethBalance).decimalPlaces(0),
        };

        console.log('Buying tokens', overrides);

        await this.contract.ethToTokenSwapInput(largeNumber, getTimeStamp(100000000), overrides);
      } else { // if eth amount needs to go down sell some tokens
        const overrides = {
          gasLimit: 200000,
          gasPrice: ethers.utils.parseUnits('30', 'gwei'),
        };

        console.log('Selling tokens', overrides, this.config.walletAddress);

        // need to grab own token balance and approve for that amount
        const tokenContract = await this.tokenContract();
        const myTokens = tokenContract.balanceOf(this.config.walletAddress);
        // console.log(await tokenContract.approve(this.exchangeAddress, myTokens, overrides));
        await this.contract.tokenToEthSwapOutput(
          ethBalance.minus(a).decimalPlaces(0).toString(),
          myTokens,
          getTimeStamp(100000000),
          overrides,
        );
      }
    } catch (e) {
      console.log(e);
    }
  }

  async tokenBalance() {
    const tokenContract = await this.tokenContract();
    return BigNumber((await tokenContract.balanceOf(this.exchangeAddress)).toString());
  }

  async tokenContract() {
    const tokenAddress = await this.contract.tokenAddress();
    return this.config.erc20Contract(tokenAddress);
  }

  async tokenPrice() {
    const ethBalance = await this.ethBalance();
    const tokenBalance = await this.tokenBalance();
    return tokenBalance.dividedBy(ethBalance);
  }
}
