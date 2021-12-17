import consola, {
  BrowserReporter,
  ConsolaReporter, ConsolaReporterLogObject, ConsolaReporterArgs,
} from 'consola';

// =============================================================================

// https://github.com/unjs/consola/blob/master/src/reporters/browser.js

class Reporter implements ConsolaReporter {
  defaultColor: string;
  levelColorMap: Record<number, string>;
  typeColorMap: Record<string, string>;

  constructor() {
    this.defaultColor = '#7f8c8d' // Gray
    this.levelColorMap = {
      0: '#c0392b', // Red
      1: '#f39c12', // Yellow
      3: '#00BCD4' // Cyan
    }
    this.typeColorMap = {
      success: '#2ecc71' // Green
    }
  }

  log (logObj: ConsolaReporterLogObject, args: ConsolaReporterArgs) {
    const consoleLogFn = logObj.level < 1
      ? console.error
      : logObj.level === 1 && console.warn ? console.warn : console.log

    // const type = logObj.type !== 'log' ? logObj.type : '';
    const type = logObj.type;
    const tag = logObj.tag ? logObj.tag : '';

    // Styles
    const color = this.typeColorMap[logObj.type] || this.levelColorMap[logObj.level] || this.defaultColor
    const typeStyle = `
      background: ${color};
      border-radius: 0 0.5em 0.5em 0;
      color: white;
      font-weight: bold;
      padding: 2px 0.5em;
      text-shadow: 1px 1px 3px black;
    `;
    const tagStyle = `
      background: #87084c;
      border-radius: 0.5em 0 0 0.5em;
      color: white;
      font-weight: bold;
      padding: 2px 0.5em;
      text-shadow: 1px 1px 3px black;
    `;

    const badge = `%c${tag}%c${type}`;

    // Log to the console
    if (typeof logObj.args[0] === 'string') {
      consoleLogFn(
        `${badge}%c ${logObj.args[0]}`,
        tagStyle,
        typeStyle,
        // Empty string as style resets to default console style
        '',
        ...logObj.args.slice(1),
      )
    } else {
      consoleLogFn(
        badge,
        tagStyle,
        typeStyle,
        ...logObj.args,
      )
    }
  }
}


// =============================================================================

const logger = consola.create({
  reporters: [
    new Reporter(),
  ],
}).withTag('reactions');

export default logger;
