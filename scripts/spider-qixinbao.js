
const spiderQxb = require('./spider-qixinbao-main');

module.exports = {


	friendlyName: 'spider qixinbao',


	description: '',


	inputs: {

	},


	fn: async function (inputs, exits) {
		sails.log('start spider qixinbao');

		while(true) {
			await Promise.all([
				spiderQxb.run();
			]);

			await cutil.msleep(1000 * 2);
		}

		sails.log('stop spider qixinbao');
		return exits.success();
	}

}
