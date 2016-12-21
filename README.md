# mocha-webpack-plugin

Runs your tests on `node` using `mocha` after your assets are bundled.

> This plugin doesn't require your test bundle to be emitted to disk. Useful when working with `memory-fs`.

## Installation

    npm install --save-dev mocha-webpack-plugin
    
## Usage

`webpack.config.js`

```js
const path = require('path');
const MochaWebpackPlugin = require('mocha-webpack-plugin');

module.exports = {

  context: path.join(__dirname, 'src'),

  entry: {
    tests: glob.sync('**/*.test.js')
  },
  
  target: 'node', /* required so the plugin can run your tests in node */

  /* ...configure loaders, resolvers, etc... */

  plugins: [
    new MochaWebpackPlugin({
      chunkName: 'tests'
    })
  ]

};

```