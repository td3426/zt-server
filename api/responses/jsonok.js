/**
 * jsonok.js
 *
 * A custom response.
 *
 * Example usage:
 * ```
 *     return res.jsonok();
 *     // -or-
 *     return res.jsonok(optionalData);
 * ```
 *
 * Or with actions2:
 * ```
 *     exits: {
 *       somethingHappened: {
 *         responseType: 'jsonok'
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

module.exports = function jsonok(data, msg) {

    var req = this.req;
    var res = this.res;

    var $ret = {
        errcode: 0,
        message: msg || (_.isString(data) ? data : ''),
        result: _.isString(data) ? {} : data
    };

    if(sails.config.debugResponse && req.__sysvar && req.__sysvar.req_uuid) {
        let req_uuid = req.__sysvar.req_uuid;
        let req_tmstr = moment().format('YYYY-MM-DD HH:mm:ss');
        sails.log.debug('[' + req_uuid + '@' + req_tmstr + '] return  -> \n' , JSON.stringify($ret, null, '\t'));
    }

    return res.status(200).send($ret);

};
