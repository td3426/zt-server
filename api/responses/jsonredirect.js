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

module.exports = function jsonredirect(url, msg) {

    var req = this.req;
    var res = this.res;

    sails.log.verbose('Ran custom response: res.jsonredirect()');

    return res.status(200).send({
        status: 304,
        url: url || '/',
        msg: msg || ''
    });

};
