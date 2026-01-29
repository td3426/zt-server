
const moment = require('moment');
const flaverr = require('flaverr');

module.exports = {

	listCat: async function() {
        var ret = await ProductCat.getAll();

        return res.jsonok(_.values(ret));
	},

};

