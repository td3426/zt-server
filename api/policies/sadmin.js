const uuidv4 = require('uuid/v4');
const moment = require('moment');

module.exports = async function(req, res, proceed) {
	var $token = req.headers.stoken || req.param('stoken');
	if($token != 'd4bf1f#04156a3^107ea') return res.jsonerr('未认证');

    return proceed();
};

