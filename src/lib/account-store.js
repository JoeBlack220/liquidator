import {
  getPerpAccountBalances,
  getLiquidatablePerpAccounts,
  getLiquidatableSoloAccounts,
  getExpiredAccounts,
} from '../clients/dydx';
import { delay } from './delay';
import Logger from './logger';

export default class AccountStore {
  // four fields all come from dydx library
  constructor() {
    this.liquidatorPerpBalances = [];
    this.liquidatablePerpAccounts = [];
    this.liquidatableSoloAccounts = [];
    this.expiredAccounts = [];
  }

  // getters for four fields
  getLiquidatorPerpBalances = () => this.liquidatorPerpBalances;

  getLiquidatablePerpAccounts = () => this.liquidatablePerpAccounts;

  getLiquidatableSoloAccounts = () => this.liquidatableSoloAccounts;

  getExpiredAccounts = () => this.expiredAccounts;

  // just call _poll()
  start = () => {
    Logger.info({
      at: 'AccountStore#start',
      message: 'Starting account store',
    });
    this._poll();
  }

  // just call _update() in a given interval
  _poll = async () => {
    for (;;) {
      try {
        await this._update();
      } catch (error) {
        Logger.error({
          at: 'AccountStore#_poll',
          message: error.message,
          error,
        });
      }

      await delay(Number(process.env.ACCOUNT_POLL_INTERVAL_MS));
    }
  }

  // update the four fields in the class
  _update = async () => {
    Logger.info({
      at: 'AccountStore#_update',
      message: 'Updating accounts...',
    });

    const [
      { balances: nextLiquidatorPerpBalances },
      { accounts: nextLiquidatablePerpAccounts },
      { accounts: nextLiquidatableSoloAccounts },
      { accounts: nextExpiredAccounts },
    ] = await Promise.all([
      getPerpAccountBalances(process.env.WALLET_ADDRESS),
      getLiquidatablePerpAccounts(),
      getLiquidatableSoloAccounts(),
      getExpiredAccounts(),
    ]);

    // Do not put an account in both liquidatable and expired
    const filteredNextExpiredAccounts = nextExpiredAccounts.filter(
      ea => !nextLiquidatableSoloAccounts.find(la => la.uuid === ea.uuid),
    );

    this.liquidatorPerpBalances = nextLiquidatorPerpBalances;
    this.liquidatablePerpAccounts = nextLiquidatablePerpAccounts;
    this.liquidatableSoloAccounts = nextLiquidatableSoloAccounts;
    this.expiredAccounts = filteredNextExpiredAccounts;

    Logger.info({
      at: 'AccountStore#_update',
      message: 'Finished updating accounts',
    });
  }
}
