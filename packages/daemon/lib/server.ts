  
import { Application } from "express";
import * as bodyParser from "body-parser";
import morgan from "morgan";
import * as fs from "fs";
import { WriteStream } from "fs";
import * as path from "path";
import helmet from "helmet";
import * as winston from "winston";

// import rateLimiter from "./middlewares/rateLimit";
// import { unCoughtErrorHandler } from "./handlers/errorHandler";
// import Routes from "./routes";

// app.enable('trust proxy'); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)

export default class Server {
  constructor(app: Application) {
    this.config(app);
    // new Routes(app);
  }

  public config(app: Application): void {
    const accessLogStream: WriteStream = fs.createWriteStream(
      path.join(__dirname, "../../../logs/access.log"),
      { flags: "a" }
    );
    app.use(morgan("combined", { stream: accessLogStream }));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(helmet());
    // app.use(rateLimiter()); //  apply to all requests
    // app.use(unCoughtErrorHandler);
  }
}

process.on("beforeExit", function (err) {
  winston.error(JSON.stringify(err));
  console.error(err);
});