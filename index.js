const argv = require('minimist')(process.argv.slice(2));
const verbose = argv.hasOwnProperty('debug') && argv.debug === true;
const { time } = require(`${global.appRoot}/lib`);
const Base = require('ninjakatt-plugin-base');
const colors = require('colors');

module.exports = class Logger extends Base {
  constructor() {
    super();
  }

  setup() {
    global.emitter.on('message', (message, event) => {
      console.log(colors[this.getColor(event)](`[${time.print()}] ${message}`));
    });
  }

  getColor(event = 'none') {
    switch (event) {
      case 'connect':
      case 'start':
        return 'yellow';
      case 'info':
        return 'blue';
      case 'success':
      case 'add':
        return 'green';
      case 'error':
      case 'remove':
        return 'red';
      default:
        return 'white';
    }
  }
};
