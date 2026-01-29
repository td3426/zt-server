/**
 * jsonerr.js
 *
 * A custom response.
 *
 * Example usage:
 * ```
 *     return res.jsonerr();
 *     // -or-
 *     return res.jsonerr(optionalData);
 * ```
 *
 * Or with actions2:
 * ```
 *     exits: {
 *       somethingHappened: {
 *         responseType: 'jsonerr'
 *       }
 *     }
 * ```
 *
 * ```
 *     throw 'somethingHappened';
 *     // -or-
 *     throw { somethingHappened: optionalData }
 * ```
 */

const moment = require('moment');

module.exports = function jsonerr(msg, code, data) {

    let req = this.req;
    let res = this.res;

	let $msg = '';
	if(_.isArray(msg)) $msg = msg.join('\n');
	else if(_.isString(msg)) $msg = msg;
	else if(_.isFunction(msg.toString)) $msg = msg.toString();
	else $msg = '未知错误';

    let $ret = {
        errcode : code || 1,
        message : $msg,
        result  : data || ''
    };

    if(sails.config.debugResponse && req.__sysvar && req.__sysvar.req_uuid) {
        let req_type = req.__sysvar.req_type;
        let req_uuid = req.__sysvar.req_uuid;
        let req_tmstr = moment().format('YYYY-MM-DD HH:mm:ss');
        sails.log.debug('[' + req_uuid + '@' + req_tmstr + '] return  -> \n' , $ret);
    }

    return res.status(200).send($ret);
};
