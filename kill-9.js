"use strict";
/*jshint eqnull:true */
/*jshint node:true */
/*eslint-disable no-console */

var kill9 = {};

var express = require('express');

kill9 = function kill9(opts){
    var killer=express();
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
    if(opts.log){
        console.log('kill-9 installed. '+opts.log);
        console.log('pid='+pid);
    }
    killer.get('/'+(opts.statement||'kill-9'),function killer(req,res){
        if(req.query.pid==pid){
            res.status(opts.statusKilled||kill9.defaults.statusKilled);
            if(opts.location){
                res.header('Location',opts.location);
            }else{
                res.header('Content-Type', 'text/plain; charset=utf-8');
            }
            res.end(opts.messageKilled||'kill -9 success');
            _process.exit(opts.exitCode||kill9.defaults.exitCode);
        }else{
            res.status(opts.statusBad||kill9.defaults.statusBad);
            if(opts.locationBad){
                res.header('Location',opts.locationBad);
            }else{
                res.header('Content-Type', 'text/plain; charset=utf-8');
            }
            res.end(opts.messageBad||'kill -9 unknown');
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