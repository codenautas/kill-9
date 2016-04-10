<!--multilang v0 es:LEEME.md en:README.md  -->
# kill-9
<!--lang:es-->
un modo de matar el proceso **node** desde el navegador. Algo así como http://yoursite.kom/kill-9

<!--lang:en--]
a way to kill node process from client navigator. Something like http://yoursite.kom/kill-9

[!--lang:*-->

<!-- cucardas -->
![extending](https://img.shields.io/badge/stability-extending-orange.svg)
[![npm-version](https://img.shields.io/npm/v/kill-9.svg)](https://npmjs.org/package/kill-9)
[![downloads](https://img.shields.io/npm/dm/kill-9.svg)](https://npmjs.org/package/kill-9)
[![linux](https://img.shields.io/travis/codenautas/kill-9/master.svg)](https://travis-ci.org/codenautas/kill-9)
[![windows](https://ci.appveyor.com/api/projects/status/github/codenautas/kill-9?svg=true)](https://ci.appveyor.com/project/codenautas/kill-9)
[![coverage](https://img.shields.io/coveralls/codenautas/kill-9/master.svg)](https://coveralls.io/r/codenautas/kill-9)
[![climate](https://img.shields.io/codeclimate/github/codenautas/kill-9.svg)](https://codeclimate.com/github/codenautas/kill-9)
[![dependencies](https://img.shields.io/david/codenautas/kill-9.svg)](https://david-dm.org/codenautas/kill-9)
[![qa-control](http://codenautas.com/github/codenautas/kill-9.svg)](http://codenautas.com/github/codenautas/kill-9)

<!--multilang buttons-->

idioma: ![castellano](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-es.png)
también disponible en: 
[![English](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-en.png)](README.md) - 

<!--lang:es-->

## instalación

<!--lang:en--]
## Install

[!--lang:*-->
```sh
$ npm install kill-9
```

<!--lang:es-->

## Usar en el navegador

<!--lang:en--]
## Use it in the client navigator

[!--lang:*-->
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
    res.send("<h1>kill-9 demo</h1><p>site up<p>try <a href="+kill_url+">"+kill_url+"</a>");
}

app.get('/index.html',site_up);
app.get('/',site_up);
```

### kill9([options])

<!--lang:es-->

Retorna una función *middleware* para usar con `express.use`. 
Una vez instalada se puede matar el proeso desde el navegador con la sentencia "kill". 

<!--lang:en--]
Returns a function middleware to use with ``express.use``. 
Once installed you can kill the process typing "kill sentence" in the navigator.

### Example:

[!--lang:*-->
```url
http://thesite.kom/kill-9?pid=12345
```
<!--lang:es-->

### options

opciones  | tipo    | valor predeterminado       | detalles
----------|---------|-------------|-------------------------
statement | text    | "kill-9"    | La sentencia que hay que poner en la url. 
pid       | integer | process.pid | El número de pid que hay que pasar como parámetro. Por defecto kill-9 usa el pid real pid obtenido con ``process.pid``
log       | boolean | false       | Setear log para que kill-9 muestre una mensaje por console.log cuando se instala. Se puede especificar el mensaje o `true`
statusKilled  | integer | 200           | El valor de status que devuelve al matar
location      | url     |               | La URL a donde redireccionar (es obligatorio si statusKilled está entre 300 y 303. 
messageKilled | text    | "kill -9 success" | El mensaje a mostrar cuando el *kill* tiene éxito
statusBad     | integer | 404               | El status cuando el *pid* no coincide con el esperado
locationBad   | url     |                   | La URL a donde redireccionar en caso de falla. Es obligatorio si statusKilled está entre 300 y 303. 
messageBad    | text    | "kill -9 unknown" | El mensaje a mostrar cuando *pid* no coincide con el esperado.
process       | object  | process           | El objeto proceso (para text, se le puede pasar un objecto *mock*)

<!--lang:en--]

### options

option        | type    | default value | details
--------------|---------|---------------|-------------------------
statement     | text    | "kill-9"      | The statement that you must type in the url. 
pid           | integer | process.pid   | The pid value that you must pass in the pid parameter. By default kill-9 uses the real pid obteined from ``pid`` property of ``process`` object: ``process.pid``
log           | boolean | false         | If log is set kill-9 show a console.log when it is installed. You can send true or a message.
statusKilled  | integer | 200           | The status sent in the response for the case of success.
location      | url     |               | The location for a redirect. This is mandatory if statusKilled between 300 and 303. 
messageKilled | text    | "kill -9 success" | The message to display in successful kills. 
statusBad     | integer | 404               | The status sent when the pid doesn't match.
locationBad   | url     |                   | The location for a redirect. This is mandatory if statusKilled between 300 and 303. 
messageBad    | text    | "kill -9 unknown" | The message to display when when the pid doesn't match.
process       | object  | process           | The process option is for test purpose. You can pass a *mock object*. 
 
[!--lang:*-->

```js
app.use(kill9({log:"remember to delete in production"}));

// Supose that exists getMode(). This is better
if(getMode()=='develop'){
    app.use(kill9({log:true}));
}
```

```js
app.use(kill9({statusKilled:301, location:'other_site.kom'}));
```

```js
app.use(kill9({messageKilled: "I'll be back"}));
```

```js
app.use(kill9({messageBad: "Not foud"}));
```

```js
function ProcessMock(){
    this.pid=444;
    this.codeRecived=null;
    this.exit=function(code){
        this.codeRecived=code;
    }
}

var pm=new ProcessMock();
test_app.use(
    kill9({process:pm})
).get(
    'kill-9?pid=444'
).then(function(){
    assert.equal(mp.codeRecived, 444);
});
```
<!--lang:es-->

## Notas

 + **No es seguro para poner en un server en producción.** Kill-9 no valida el usuario ni confirma la instrucción
   + puede usarse junto con [login-plus](npmjs.org/package/login-plus) o algún otro middleware que valide el usuario (lo que tiene el defecto de no poder matar el proceso si el mecanismo de validación de usuarios está fallando)
 + Actualmente options.pid puede ser un texto, esto podría cambiar en futuras versiones. 
 
<!--lang:en--]

## Notes

 + **This is not secure in production servers. Use it only in developer servers**. Kill-9 lacks of password or validate user or any way for confirm legal use.
 + Actually options.pid can be a text, but I don't know if this will change in the future. 

[!--lang:*-->
 
## License

[GPL-2.0](LICENSE)


