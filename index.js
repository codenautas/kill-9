/*!
 * kill-9
 * 2015 Emilio Platzer
 * GNU Licensed
 */

/**
 * Module dependencies.
 */

var express = require('express');

/**
 * @param {Object} opts
 * @return {Function}
 * @api public
 */

exports = module.exports = function kill9(opts){
    var killer=express();
    var _process=opts.process || process;
    var pid=opts.pid || _process.pid;
    if(opts.statusKilled>=300 && opts.statusKilled<=303 && !('location' in opts)){
        throw new Error('kill-9: options.location required');
    };
    if(opts.statusBad>=300 && opts.statusBad<=303 && !('locationBad' in opts)){
        throw new Error('kill-9: options.locationBad required');
    };
    if(!(opts.statusKilled>=300 && opts.statusKilled<=303) && ('location' in opts)){
        throw new Error('kill-9: options.location is only for redirect');
    };
    if(!(opts.statusBad>=300 && opts.statusBad<=303) && ('locationBad' in opts)){
        throw new Error('kill-9: options.locationBad is only for redirect');
    };
    if(opts.log){
        console.log('kill-9 installed. '+opts.log);
        if(!opts.pid){
            console.log('pid='+pid);
        }
    }
    killer.get('/'+(opts.statement||'kill-9'),function killer(req,res){
        if(req.query.pid==pid){
            res.status(opts.statusKilled||200);
            if(opts.location){
                res.header('Location',opts.location);
            }
            res.send(opts.messageKilled||'kill -9 success');
            _process.exit(opts.exitCode||0);
        }else{
            res.status(opts.statusBad||404);
            if(opts.locationBad){
                res.header('Location',opts.locationBad);
            }
            res.send(opts.messageBad||'kill -9 unknown');
        }
    });
    return killer;
}
