const { time } = require(`${global.appRoot}/lib`);
const colors = require('colors');
const fs = require('fs-extra');
const path = require('path');

module.exports = class Logger {
  constructor() {
    this.construct(__dirname);
    this.logFile = path.resolve(global.settingsPath, 'logger.log');
    fs.ensureFileSync(this.logFile);
  }

  setup() {
    this.logDebug('Setting up logger plugin');
  }

  subscriptions() {
    this.subscribe('message', this.actOnMessage);
  }

  routes() {
    this.route('get', 'log', this.getLog);
    this.route('delete', 'log', this.deleteLog);
  }

  /********* Event Functions *********/

  actOnMessage = (message, event, sender) => {
    if (!this.shouldLog(event)) {
      return;
    }

    const eventColor = this.getColor(event);

    this.logConsole(
      colors[eventColor](
        `[${time.print()}] [${sender.toLowerCase()}] ${message}`
      )
    );

    if (this.settings.saveToFile) {
      this.writeLog({
        color: eventColor,
        time: time.print(),
        message: `[${sender}] ${message}`,
      });
    }
  };

  /********* Route Functions *********/

  getLog = async (req, res) => {
    const log = await this.readLog();
    return res.status(200).send(log.toString());
  };

  deleteLog = async (req, res) => {
    await this.deleteLog();
    return res.status(200).send();
  };

  /********* Plugin Functions *********/

  async writeLog({ color, time, message }) {
    try {
      const file = fs.createWriteStream(this.logFile, { flags: 'a' });
      file.write(`${color};${new Date(time).toLocaleString()};${message}\n`);
      file.end();
    } catch (e) {
      this.logConsole(e);
    }
  }

  async deleteLog() {
    return await fs.writeFile(this.logFile, '');
  }

  async readLog() {
    try {
      return await fs.readFile(this.logFile);
    } catch (e) {
      if (e.code === 'ENOENT') {
        fs.writeJSON(path.resolve(global.settingsPath, this.fileName), []);
      }
    }
  }

  shouldLog(event) {
    const isError = event === 'error';
    const isWarn = event === 'warn';
    const isInfo = event === 'info';
    const isDebug = event === 'debug';
    const isDiag = event === 'diag';

    switch (this.settings.loglevel) {
      case 'error':
        return isError;

      case 'warn':
        return isError || isWarn;

      default:
      case 'info':
        return isError || isWarn || isInfo;

      case 'debug':
        return isError || isWarn || isInfo || isDebug;

      case 'diag':
        return isError || isWarn || isInfo || isDebug || isDiag;
    }
  }

  getColor(event = 'none') {
    switch (event) {
      case 'error':
        return 'red';

      case 'warn':
        return 'orange';

      case 'info':
        return 'blue';

      case 'debug':
        return 'cyan';

      case 'diag':
        return 'gray';

      default:
        return 'white';
    }
  }
};
