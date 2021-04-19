import { Logger } from '@node-lightning/logger';
import { Application, Request } from 'express';
import basicAuth, { IAsyncAuthorizerOptions } from 'express-basic-auth';
import { sha256 } from '@node-lightning/crypto';
import { IArguments, IDB } from '../../../utils/config';
import { wrapAsync, validApiKey } from '../../../utils/helper';
import OrderRoutes from './order';
import DlcRoutes from './dlc';
import { Endpoint } from '../../Endpoint';
import { Client } from '../../../client';
import ContractInfoRoutes from './contract';

export class RoutesV0 {
  public contractInfo: ContractInfoRoutes;
  public order: OrderRoutes;
  public dlc: DlcRoutes;
  public db: IDB;
  public client: Client;
  public prefix = 'api/v0';

  constructor(
    app: Application,
    argv: IArguments,
    db: IDB,
    logger: Logger,
    client: Client,
  ) {
    this.db = db;
    this.client = client;
    this.contractInfo = new ContractInfoRoutes(argv, db, logger, client);
    this.order = new OrderRoutes(argv, db, logger, client);
    this.dlc = new DlcRoutes(argv, db, logger, client);

    const options: IAsyncAuthorizerOptions = {
      authorizeAsync: true,
      authorizer: this.authorizer.bind(this),
      unauthorizedResponse: (req: Request) => {
        const ip =
          req.headers['x-forwarded-for'] ||
          req.connection.remoteAddress ||
          req.socket.remoteAddress;

        return `Unauthorized: Incorect API Key. IP ${ip}`;
      },
    };

    app.get(
      this.getEndpoint(Endpoint.OrderOffer),
      basicAuth(options),
      wrapAsync(this.order.getOffer.bind(this.order)),
    );
    app.post(
      this.getEndpoint(Endpoint.OrderOffer),
      basicAuth(options),
      wrapAsync(this.order.postOffer.bind(this.order)),
    );
    app.get(
      this.getEndpoint(Endpoint.OrderAccept),
      basicAuth(options),
      wrapAsync(this.order.getAccept.bind(this.order)),
    );
    app.post(
      this.getEndpoint(Endpoint.OrderAccept),
      basicAuth(options),
      wrapAsync(this.order.postAccept.bind(this.order)),
    );
    app.get(
      this.getEndpoint(Endpoint.DlcOffer),
      basicAuth(options),
      wrapAsync(this.dlc.getOffer.bind(this.dlc)),
    );
    app.post(
      this.getEndpoint(Endpoint.DlcOffer),
      basicAuth(options),
      wrapAsync(this.dlc.postOffer.bind(this.dlc)),
    );
    app.get(
      this.getEndpoint(Endpoint.DlcAccept),
      basicAuth(options),
      wrapAsync(this.dlc.getAccept.bind(this.dlc)),
    );
    app.post(
      this.getEndpoint(Endpoint.DlcAccept),
      basicAuth(options),
      wrapAsync(this.dlc.postAccept.bind(this.dlc)),
    );
    app.get(
      this.getEndpoint(Endpoint.DlcSign),
      basicAuth(options),
      wrapAsync(this.dlc.getSign.bind(this.dlc)),
    );
    app.post(
      this.getEndpoint(Endpoint.DlcSign),
      basicAuth(options),
      wrapAsync(this.dlc.postSign.bind(this.dlc)),
    );
    app.post(
      this.getEndpoint(Endpoint.DlcFinalize),
      basicAuth(options),
      wrapAsync(this.dlc.postFinalize.bind(this.dlc)),
    );
    app.get(
      this.getEndpoint(Endpoint.DlcContract, ':contractid'),
      basicAuth(options),
      wrapAsync(this.dlc.getContract.bind(this.dlc)),
    );
    app.post(
      this.getEndpoint(Endpoint.DlcExecute),
      basicAuth(options),
      wrapAsync(this.dlc.postExecute.bind(this.dlc)),
    );
    app.post(
      this.getEndpoint(Endpoint.DlcRefund),
      basicAuth(options),
      wrapAsync(this.dlc.postRefund.bind(this.dlc)),
    );
  }

  private getEndpoint(endpoint: Endpoint, suffix?: string): string {
    return `/${this.prefix}/${endpoint}${suffix ? `/${suffix}` : ``}`;
  }

  private async authorizer(_: string, password: string, cb) {
    const walletExists = await this.db.wallet.checkSeed();
    if (!walletExists) return cb(new Error('Wallet not created'), false);

    const valid = validApiKey(password);
    if (!valid) return cb(new Error('Invalid API Key'), false);

    try {
      const apiKey = Buffer.from(password, 'hex');
      const apiKeyHash = await this.db.wallet.findApiKeyHash();
      if (Buffer.compare(apiKeyHash, sha256(apiKey)) !== 0)
        return cb(new Error('Incorrect API Key'), false);
      const mnemonic = await this.db.wallet.findSeed(apiKey);
      if (!this.client.seedSet) {
        this.client.setSeed(mnemonic);
      }
      return cb(null, true);
    } catch (e) {
      return cb(new Error('Incorrect API Key'), false);
    }
  }
}
