"use strict";
/*jshint eqnull:true */
/*jshint node:true */
/*eslint-disable no-console */

var kill9 = {};

var express = require('express');
var crypto = require('crypto');
var bodyParser = require('body-parser');

function sendFeedback(res, status, location, message){
    res.status(status);
    if(location){
        res.header('Location',location);
    }else{
        res.header('Content-Type', 'text/plain; charset=utf-8');
    }
    res.end(message);
}

kill9 = function kill9(opts){
    var killer=express();
    killer.use(bodyParser.json());
    killer.use(bodyParser.urlencoded({extended:true}));
    var _process=opts.process || process;
    var pid=opts.pid || _process.pid;
    [ 
        { statusOpt:'statusKilled', locationOpt:'location'    },
        { statusOpt:'statusBad'   , locationOpt:'locationBad' },
    ].forEach(function(info){
        var is=kill9.isRedirectCode(opts[info.statusOpt]);
        var has=(info.locationOpt in opts);
        if(is!==has){
            throw new Error('kill-9: options.'+info.locationOpt+(has?' is only for redirect':' required'));
        }
    });
    if(! ('masterPass' in opts)) { throw new Error('kill-9: options.materPass is required'); }
    if(opts.log){
        console.log('kill-9 installed. '+opts.log);
        console.log('pid='+pid);
    }
    var locationPost = '/'+(opts.locationPost||'kill-9');
    killer.get('/'+(opts.statement||'kill-9'),function killer(req,res){
        if(req.query.pid==pid){
            var confirmTimeout = (opts.confirmTimeout || new Date().getTime()+(60 * 1000)).toString();
            kill9.postParams = {random:Math.random(), hash:crypto.createHash('md5').update((new Date().getTime() + process.pid).toString()).digest('hex')};
            res.header('Content-Type', 'text/html; charset=utf-8');
            var html = '<form method="post" action="'+locationPost+'">\n'+
                       (opts.messageConfirm || 'confirm kill-9')+'<br>\n'+
                       '<input type="password" name="masterpass"  autofocus /><br>\n'+
                       '<input type="submit" name="submit" value="'+(opts.messageSubmit||'Ok')+'" /><br>\n'+
                       '<input type="hidden" name="params" value=\''+JSON.stringify(kill9.postParams)+'\' /><br>\n'+
                       '<input type="hidden" name="confirmTimeout" value="'+confirmTimeout+'" /><br>\n'+
                       '</form>';
            res.end(html);
        }else{
            sendFeedback(
                res, 
                opts.statusBad||kill9.defaults.statusBad,
                opts.locationBad,
                opts.messageBad||'kill -9 unknown'
            );
        }
    });
    killer.post(locationPost, function(req,res){
        //try { console.log(req.body); } catch(e) { console.log("post error", e); }
        try {
            var vars = req.body;
            ['masterpass', 'submit', 'params', 'confirmTimeout'].forEach(function(pVar) {
                if(!(pVar in vars)) { throw new Error('tainted vars'); }
            });
            if(JSON.stringify(kill9.postParams) != vars.params) { throw new Error('tainted content'); }
            var timeout = new Date().getTime();
            if(timeout > parseInt(vars.confirmTimeout)) { throw new Error('request timeout'); }
            if(vars.masterpass !== opts.masterPass) { throw new Error('authentication error'); }
            sendFeedback(
                res, 
                opts.statusKilled||kill9.defaults.statusKilled, 
                opts.location, 
                opts.messageKilled||'kill -9 success'
            );
            _process.exit(opts.exitCode||kill9.defaults.exitCode);
        } catch(e) {
            sendFeedback(
                res, 
                opts.statusBad||kill9.defaults.statusBad,
                opts.locationBad,
                'kill -9 '+e.message
            );
        }
    });
    return killer;
};

kill9.defaults={
    statusKilled:200,
    exitCode:0,
    statusBad:404
};

kill9.isRedirectCode = function isRedirectCode(htmlCode){
    return htmlCode>=300 && htmlCode<=303;
};

module.exports = kill9;