/**
 * Global Variable Configuration
 * (sails.config.globals)
 *
 * Configure which global variables which will be exposed
 * automatically by Sails.
 *
 * For more information on any of these options, check out:
 * https://sailsjs.com/config/globals
 */

global['cutil'] = require('../common/util');
global['Fadada'] = require('../common/fadada/Fadada');
global['MesApi'] = require('../common/mes/Mes');
global['AdminApi'] = require('../common/admincenter/Admincenter');
global['PayApi'] = require('../common/pay/Pay');
global['FileApi'] = require('../common/file/File');
global['HtApi'] = require('../common/ht/HtCenter');
global['TransApi'] = require('../common/trans/Trans');
global['TGSttApi'] = require('../common/tg/TGStatistics');
global['TGDictApi'] = require('../common/tg/tgDict');
global['WxApi'] = require('../common/wx/Wx');
global['MqApi'] = require('../common/queue/Mq');
global['FxApi'] = require('../common/fx/Fx');
global['WlApi'] = require('../common/wl/wl');

module.exports.globals = {

    /****************************************************************************
     *                                                                           *
     * Whether to expose the locally-installed Lodash as a global variable       *
     * (`_`), making  it accessible throughout your app.                         *
     * (See the link above for help.)                                            *
     *                                                                           *
     ****************************************************************************/

    // _: require('@sailshq/lodash'),
    _: require('lodash'),

    /****************************************************************************
     *                                                                           *
     * Whether to expose the locally-installed `async` as a global variable      *
     * (`async`), making it accessible throughout your app.                      *
     * (See the link above for help.)                                            *
     *                                                                           *
     ****************************************************************************/

    async: require('async'),

    /****************************************************************************
     *                                                                           *
     * Whether to expose each of your app's models as global variables.          *
     * (See the link at the top of this file for more information.)              *
     *                                                                           *
     ****************************************************************************/

    models: true,

    /****************************************************************************
     *                                                                           *
     * Whether to expose the Sails app instance as a global variable (`sails`),  *
     * making it accessible throughout your app.                                 *
     *                                                                           *
     ****************************************************************************/

    sails: true

};
