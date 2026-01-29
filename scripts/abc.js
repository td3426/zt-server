const moment = require('moment');

module.exports = {
    friendlyName: 'Abc',
    description: 'sails run abc',
    inputs: {},
    fn: async function (inputs, exits) {
        // sails.log('Running custom shell script... (`abc`)');

        // var hashed = await sails.helpers.passwords.hashPassword('111111');
        //
        // sails.log(hashed + '\n');
        //

        // moment.locale('zh-cn');
        // sails.log.debug(moment().format('YYYYMMDD'), moment().locale());

        // sails.log.debug(
        //     require('path').resolve(sails.config.appPath, sails.config.custom.uimgPath, 'aaa')
        // );

        // sails.log.debug(sails.getUrlFor('attrDict.edit').replace(':id', 3));

        // _.each(sails.config.routes, function(v, k){
        //     var $k = k.replace(/\s+/, ' ').toLowerCase();
        //     sails.log.debug($k);
        // });

        // sails.log(await sails.helpers.cache.set('abc:test', 'test value'));
        // sails.log(await sails.helpers.cache.get('abc:test'));
        // sails.log(await sails.helpers.cache.expire('abc:test', 2800));
        // sails.log(await sails.helpers.cache.ttl('abc:test'));

        // var path = require('path');
        // var fs = require('fs');
        // var $c = fs.readFileSync(path.resolve(sails.config.appPath, 'odata/data_robots.json'));
        // fs.copyFileSync(path.resolve(sails.config.appPath, 'odata/' + item.thumb), path.resolve(sails.config.appPath, 'assets/uimg/imp/' + $pd_id + path.extname(item.thumb)));

        //var ret = require('../common/util').createCaptcha();
        //console.log(ret.text, ret.token);

		//let $comp_row = await Comp.findOne({id: 17});
		//try {
		//	let $dataex_api = new DataexApi();
		//	await $dataex_api.notify(sails.config.dataexApi.channelNoCompAdd, $comp_row);
		//	console.log(moment().valueOf());
		//} catch($e) {
		//	sails.log.error($e);
		//}
		
		//await User.update().set({
		//});

		await sails.getDatastore('factory').transaction(async (db, proceed) => {
			db.query('update vtest set skuNo=concat(skuNo, 3)');
			return proceed(undefined, 'ok');
		});

        return exits.success();
    }
};

