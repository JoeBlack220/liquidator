import { getPerpMarkets, getSoloMarkets } from '../clients/dydx';
import { delay } from './delay';
import Logger from './logger';

export default class MarketStore {
  // two fields come from dydx library
  constructor() {
    this.soloMarkets = [];
    this.perpMarkets = [];
  }

  // getter for two fields
  getSoloMarkets = () => this.soloMarkets;

  getPerpMarkets = () => this.perpMarkets;

  // call _poll()
  start = () => {
    Logger.info({
      at: 'MarketStore#start',
      message: 'Starting market store',
    });
    this._poll();
  }

  // call _update() after every given interval
  _poll = async () => {
    for (;;) {
      try {
        await this._update();
      } catch (error) {
        Logger.error({
          at: 'MarketStore#_poll',
          message: error.message,
          error,
        });
      }

      await delay(Number(process.env.MARKET_POLL_INTERVAL_MS));
    }
  }

  // use dydx library to get two fields updated
  _update = async () => {
    Logger.info({
      at: 'MarketStore#_update',
      message: 'Updating markets...',
    });

    const [
      { markets: nextSoloMarkets },
      { markets: nextPerpMarkets },
    ] = await Promise.all([
      getSoloMarkets(),
      getPerpMarkets(),
    ]);

    this.soloMarkets = nextSoloMarkets;
    this.perpMarkets = nextPerpMarkets;

    Logger.info({
      at: 'MarketStore#_update',
      message: 'Finished updating markets',
    });
  }
}
