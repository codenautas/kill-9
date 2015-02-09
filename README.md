# kill-9
a way to kill node process from client navigator. Something like http://yoursite.kom/kill-9

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Linux Build][travis-image]][travis-url]
[![Windows Build][appveyor-image]][appveyor-url]
[![Test Coverage][coveralls-image]][coveralls-url]

## Install

```sh
$ npm install kill-9
```

## In de client navigator

![use kill-9 as a url in the navigator](docs/chromeKill-9.png)

## API

```js
var express = require('express');
var app = express();

var kill9 = require('kill-9');

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});

app.use(kill9({log:true}));

// complete example: 
function site_up(req,res){
    var kill_url='kill-9?pid='+process.pid;
    res.send("<h1>kill-9 demo</h1><p>this site now is up<p>try <a href="+kill_url+">"+kill_url+"</a>");
}

app.get('/index.html',site_up);
app.get('/',site_up);
```

### kill9(options)



## License

[GPL-2.0](LICENSE)

[npm-image]: https://img.shields.io/npm/v/kill-9.svg?style=flat
[npm-url]: https://npmjs.org/package/kill-9
[travis-image]: https://img.shields.io/travis/emilioplatzer/kill-9/master.svg?label=linux&style=flat
[travis-url]: https://travis-ci.org/emilioplatzer/kill-9
[appveyor-image]: https://img.shields.io/appveyor/ci/emilioplatzer/kill-9/master.svg?label=windows&style=flat
[appveyor-url]: https://ci.appveyor.com/project/emilioplatzer/kill-9
[coveralls-image]: https://img.shields.io/coveralls/emilioplatzer/kill-9/master.svg?style=flat
[coveralls-url]: https://coveralls.io/r/emilioplatzer/kill-9
[downloads-image]: https://img.shields.io/npm/dm/kill-9.svg?style=flat
[downloads-url]: https://npmjs.org/package/kill-9
