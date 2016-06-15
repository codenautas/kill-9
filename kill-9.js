"use strict";
/*jshint eqnull:true */
/*jshint node:true */
/*eslint-disable no-console */

var kill9 = {};

var express = require('express');
var crypto = require('crypto');
var packageJson = require('./package.json');

var limitTime;

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
    if(opts.log){
        console.log('kill-9 installed: '+opts.log+' v'+packageJson.version);
        console.log('pid='+pid);
    }
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
    if(! ('master-pass' in opts)) { throw new Error('kill-9: options.master-pass is required'); }
    var statement = '/'+(opts.statement||'kill-9');
    var locationPost = (opts.locationPost||statement);
    function receive(vars, res){
        try {
            ['masterpass', 'params', 'submit'].forEach(function(pVar) {
                if(!(pVar in vars)) { 
                    throw new Error('tainted vars'); 
                }
            });
            if(JSON.stringify(kill9.postParams) != vars.params) { throw new Error('tainted content'); }
            var actualTime = new Date().getTime();
            if(actualTime >= limitTime) { throw new Error('request timeout'); }
            if(vars.masterpass !== opts['master-pass']) { throw new Error('authentication error'); }
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
    }
    killer.get(statement,function killer(req,res){
        if(req.query.params){
            receive(req.query, res);
        }else if(req.query.pid==pid){
            limitTime = new Date().getTime()+(opts.confirmTimeout || (60 * 1000));
            kill9.postParams = {random:Math.random(), hash:crypto.createHash('md5').update((new Date().getTime() + process.pid).toString()).digest('hex')};
            res.header('Content-Type', 'text/html; charset=utf-8');
            var safe=function safe(message){
                return message.replace(/'"<>/g,'');
            };
            var method = 'post';
            if(req.body === undefined){
                method = 'get';
                locationPost = statement;
            }
            var html = '<form method="'+method+'" action="'+safe(req.baseUrl+locationPost)+'">\n'+
               (safe(opts.messageConfirm || 'confirm kill-9'))+'<br>\n'+
               '<input type="password" name="masterpass"  autofocus /><br>\n'+
               '<input type="submit" name="submit" value="'+safe(opts.messageSubmit||'Ok')+'" /><br>\n'+
               '<input type="hidden" name="params" value=\''+JSON.stringify(kill9.postParams)+'\' /><br>\n'+
               '</form>\n';
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
        receive(req.body, res);
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