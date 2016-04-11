var express = require('express');
var app = express();

var kill9 = require('..');

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});

function site_up(req,res){
    var kill_url='kill-9?pid='+process.pid;
    res.send("<h1>kill-9 demo</h1><p>this site now is up<p>try <a href="+kill_url+">"+kill_url+"</a>");
}

app.get('/index.html',site_up);
app.get('/',site_up);

app.use(kill9({log:true, masterPass:'secret101'}));

