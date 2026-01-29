/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For more information on configuration, check out:
 * https://sailsjs.com/config/http
 */

const uuidv4 = require('uuid/v4');
const moment = require('moment');

module.exports.http = {

  /****************************************************************************
  *                                                                           *
  * Sails/Express middleware to run for every HTTP request.                   *
  * (Only applies to HTTP requests -- not virtual WebSocket requests.)        *
  *                                                                           *
  * https://sailsjs.com/documentation/concepts/middleware                     *
  *                                                                           *
  ****************************************************************************/

  middleware: {

    /***************************************************************************
    *                                                                          *
    * The order in which middleware should be run for HTTP requests.           *
    * (This Sails app's routes are handled by the "router" middleware below.)  *
    *                                                                          *
    ***************************************************************************/

      order: [
          // 'cookieParser',
          // 'session',
          'bodyParser',
          'compress',
          // 'poweredBy',
          'corsRequest',
          'logRequest',
          'router',
          'www',
          'favicon',
      ],


    /***************************************************************************
    *                                                                          *
    * The body parser that will handle incoming multipart HTTP requests.       *
    *                                                                          *
    * https://sailsjs.com/config/http#?customizing-the-body-parser             *
    *                                                                          *
    ***************************************************************************/
      corsRequest: (function (){
		  return function (req,res,next) {
			  if(req.method == 'OPTIONS') {
                  sails.log.debug('request -> '
                      + req.method + ' ' + req.url
					  + '\nheader:\n----------\n',
					  req.headers,
					  '\nbody:\n----------\n' ,
					  req.body,
					  '\n'
				  );

				  return res.status(204).set({
					  "Access-Control-Allow-Origin": "*",
					  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
					  "Access-Control-Allow-Headers": "DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization,token,comp_id,user_id"
				  }).send('');
			  } else {
				return next();
			  }
          };
      })(),

      logRequest: (function (){
          return function (req,res,next) {
              let $req_uuid = uuidv4().replace(/-/g, "");
              let $req_tmstr = moment().format('YYYY-MM-DD HH:mm:ss');
              req.__sysvar = {
                  req_uuid: $req_uuid,
                  req_tmstr: $req_tmstr
              };

              if(sails.config.debugRequest > 1) {
                  sails.log.debug('[' + $req_uuid + '@' + $req_tmstr + '] request -> '
                      + req.method + ' ' + req.url
                      + '\nheader:\n----------\n',
                      req.headers,
                      '\nbody:\n----------\n' ,
                      req.body,
                      '\n'
                  );
              } else if(sails.config.debugRequest > 0) sails.log.debug('[' + $req_uuid + '@' + $req_tmstr + '] request -> ' + req.method + ' ' + req.url);

              return next();
          };
      })(),

    // bodyParser: (function _configureBodyParser(){
    //   var skipper = require('skipper');
    //   var middlewareFn = skipper({ strict: true });
    //   return middlewareFn;
    // })(),

  },

};
