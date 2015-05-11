/*!
 * kill-9
 * 2015 Emilio Platzer
 * GNU Licensed
 */

"use strict";
 
/**
 * Module dependencies.
 */

var express = require('express');

/**
 * @param {Object} opts
 * @return {Function}
 * @api public
 */

var kill9 = exports = module.exports = function kill9(opts){
    var killer=express();
    var _process=opts.process || process;
    var pid=opts.pid || _process.pid;
    if(kill9.isRedirectCode(opts.statusKilled) && !('location' in opts)){
        throw new Error('kill-9: options.location required');
    };
    if(kill9.isRedirectCode(opts.statusBad) && !('locationBad' in opts)){
        throw new Error('kill-9: options.locationBad required');
    };
    if(!kill9.isRedirectCode(opts.statusKilled) && ('location' in opts)){
        throw new Error('kill-9: options.location is only for redirect');
    };
    if(!kill9.isRedirectCode(opts.statusBad) && ('locationBad' in opts)){
        throw new Error('kill-9: options.locationBad is only for redirect');
    };
    if(opts.log){
        console.log('kill-9 installed. '+opts.log);
        console.log('pid='+pid);
    }
    killer.get('/'+(opts.statement||'kill-9'),function killer(req,res){
        if(req.query.pid==pid){
            res.status(opts.statusKilled||kill9.defaults.statusKilled);
            if(opts.location){
                res.header('Location',opts.location);
            }
            res.send(opts.messageKilled||'kill -9 success');
            _process.exit(opts.exitCode||kill9.defaults.exitCode);
        }else{
            res.status(opts.statusBad||kill9.defaults.statusBad);
            if(opts.locationBad){
                res.header('Location',opts.locationBad);
            }
            res.send(opts.messageBad||'kill -9 unknown');
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