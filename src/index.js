/* eslint no-console: 0 */
/* eslint import/first: 0 */
import './lib/env';

import AccountStore from './lib/account-store';
import MarketStore from './lib/market-store';
import LiquidationStore from './lib/liquidation-store';
import SoloLiquidator from './lib/solo-liquidator';
import PerpLiquidator from './lib/perp-liquidator';
import GasPriceUpdater from './lib/gas-price-updater';
import { loadAccounts, initializeSoloLiquidations } from './helpers/web3';

console.log(`Starting in env ${process.env.NODE_ENV}`);
if (Number(process.env.ACCOUNT_POLL_INTERVAL_MS) < 1000) {
  throw new Error('Account Poll Interval too low');
}

if (Number(process.env.MARKET_POLL_INTERVAL_MS) < 1000) {
  throw new Error('Account Poll Interval too low');
}

async function start() {
  // accounts that eligible for liquidate
  const accountStore = new AccountStore();
  const marketStore = new MarketStore();
  // manage the accounts to be liquidate in a LRU manner
  const liquidationStore = new LiquidationStore();
  const soloLiquidator = new SoloLiquidator(accountStore, marketStore, liquidationStore);
  const perpLiquidator = new PerpLiquidator(accountStore, marketStore, liquidationStore);
  const gasPriceUpdater = new GasPriceUpdater();

  await loadAccounts();

  if (process.env.SOLO_LIQUIDATIONS_ENABLED === 'true') {
    await initializeSoloLiquidations();
  }

  accountStore.start();
  marketStore.start();
  gasPriceUpdater.start();

  if (
    process.env.SOLO_LIQUIDATIONS_ENABLED === 'true'
    || process.env.SOLO_EXPIRATIONS_ENABLED === 'true'
  ) {
    soloLiquidator.start();
  }

  if (process.env.PERP_LIQUIDATIONS_ENABLED === 'true') {
    perpLiquidator.start();
  }
}

start();
