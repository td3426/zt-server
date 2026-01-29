
const uuidv4 = require('uuid/v4');

module.exports = {


    friendlyName: 'create uuid',


    description: 'create uuid',


    inputs: { },


    fn: async function (inputs, exits) {

		console.log(uuidv4().replace(/-/g, ""));

        return exits.success();
    }

};
