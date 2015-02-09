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
    if(opts.log){
        console.log('kill-9 installed. '+opts.log);
        if(!opts.pid){
            console.log('pid='+pid);
        }
    }
    killer.get('/'+(opts.statement||'kill-9'),function killer(req,res){
        if(req.query.pid==pid){
            res.status(opts.statusKilled||200).send(opts.messageKilled||'kill -9 success');
            _process.exit(opts.exitCode||0);
        }else{
            res.status(opts.statusBad||404).send(opts.messageBad||'kill -9 unknown');
        }
    });
    return killer;
}
