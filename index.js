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
    global.emitter.on('message', (message, event, sender) => {
      console.log(
        colors[this.getColor(event)](`[${time.print()}] [${sender}] ${message}`)
      );
      if (this.settings.saveToFile && this.shouldLog(event)) {
        this.writeLog({
          color: this.getColor(event),
          time: time.print(),
          message: `[${sender}] ${message}`,
        });
      }
    });

    setTimeout(() => {
      if (global.Ninjakatt.plugins.has('Webserver')) {
        this.addWebroutes();
      }
    }, 0);
  }

  async writeLog({ color, time, message }) {
    try {
      const file = fs.createWriteStream(this.logFile, { flags: 'a' });
      file.write(`${color};${new Date().toLocaleString()};${message}\n`);
      file.end();
    } catch (e) {
      console.log(e);
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

  addWebroutes() {
    const prefix = Logger.name.toLowerCase();

    emitter.emit(
      'webserver.add-route',
      'get',
      `/${prefix}/log`,
      async (req, res) => {
        const log = await this.readLog();
        res.status(200).send(log.toString());
      }
    );

    emitter.emit(
      'webserver.add-route',
      'delete',
      `/${prefix}/log`,
      async (req, res) => {
        await this.deleteLog();
        res.status(200).send();
      }
    );
  }

  shouldLog(event) {
    switch (this.settings.loglevel) {
      case 'error':
        return event === 'error';

      case 'warn':
        return event === 'error' || event === 'warn';

      case 'info':
        return event !== 'debug' && event !== 'diag';

      case 'debug':
        return event !== 'diag';

      default:
      case 'diag':
        return true;
    }
  }

  getColor(event = 'none') {
    switch (event) {
      case 'error':
        return 'red';

      case 'warn':
        return 'orange';

      default:
      case 'info':
        return 'blue';

      case 'debug':
        return 'cyan';

      case 'diag':
        return 'yellow';
    }
  }
};
