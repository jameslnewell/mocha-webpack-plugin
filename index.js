'use strict';
const debug = require('debug')('mocha-webpack-plugin');
const spawn = require('child_process').spawn;
const colorsAreSupported = require('supports-color');

const mocha = `
(function() {

  const fs = require('fs');
  const Mocha = require(${JSON.stringify(require.resolve('mocha'))});
  Mocha.reporters.Base.window.width = ${process.stdout.columns || 80};
  Mocha.reporters.Base.symbols.dot = '.';
  const mocha = new Mocha({
    ui: 'bdd',
    reporter: 'spec',
    useColors: ${colorsAreSupported ? 'true' : 'false'},
  });
  
  mocha.suite.emit('pre-require', global, '', mocha);
  
  process.nextTick(function() {
    mocha.run(failures => process.exit(failures ? 1 : 0));
  });
  
})();
`;

class MochaWebpackPlugin {

  constructor(options) {
    this.chunkName = options.chunkName;
    this.process = null;
  }

  apply(compiler) {
    compiler.plugin('emit', (compilation, callback) => {
      let output = '';

      //find the chunk by name
      const chunk = compilation.chunks.find(chunk => chunk.name === this.chunkName);
      if (!chunk) {
        compilation.errors.push(new Error(`mocha-webpack-plugin: Chunk "${this.chunkName}" was not found.`));
        return callback();
      }

      //find a script file
      const filePath = chunk.files.find(file => /\.js$/.test(file));
      if (!compilation.assets[filePath]) {
        compilation.errors.push(new Error(`mocha-webpack-plugin: No script asset for chunk "${this.chunkName}" was not found.`));
        return callback();
      }

      const source = mocha + compilation.assets[filePath].source();

      //kill the test runner if it is still running
      if (this.process) {
        this.process.kill();
        this.process = null;
      }

      //create the test runner
      this.process = spawn('node', {cwd: compiler.options.context});

      //handle errors running the test runner
      this.process
        .on('error', error => console.error(error))
        .on('exit', exitCode => {
            if (exitCode === 0) {
            console.log(output); //TODO: is there a better way of reporting this?
            callback();
          } else {
            compilation.errors.push(new Error(output));
            callback();
          }
        })
      ;

      //forward the output of the test runner to stdout/stderr
      // this.process.stdout.pipe(process.stdout);
      // this.process.stderr.pipe(process.stderr);
      this.process.stdout.on('data', data => output += data);
      this.process.stderr.on('data', data => output += data);

      //pass the compiled output to the test runner
      this.process.stdin.write(source);
      this.process.stdin.end();

    });
  }

}

module.exports = MochaWebpackPlugin;
