
const flaverr = require('flaverr');
const moment = require('moment');
const amqp   = require('amqplib');


async function needDesignProductTransNotify($params) {
	if(!_.size($params)) return;

	let $ids = [];

	//加购单品
	if(cutil.defined($params.add) && cutil.defined($params.add.single) && _.isArray($params.add.single)) {
		$ids = $params.add.single;
		$ids.filter(v => (_.isString(v) && v.trim().length));

		await DesignProduct.update({
			id        : $ids,
			priceType : CONST.PRODUCT_PRICE_TYPE_UNKNOWN
		}).set({
			stat      : CONST.PRODUCT_STAT_TRANS,
			priceType : CONST.PRODUCT_PRICE_TYPE_REQUIRE_ORDER
		});
	}

	//删除加购单品
	if(cutil.defined($params.del) && cutil.defined($params.del.single) && _.isArray($params.del.single)) {
		$ids = $params.del.single;
		$ids.filter(v => (_.isString(v) && v.trim().length));

		await DesignProduct.update({
			id        : $ids,
			priceType : CONST.PRODUCT_PRICE_TYPE_REQUIRE_ORDER
		}).set({
			priceType : CONST.PRODUCT_PRICE_TYPE_UNKNOWN,
			stat      : CONST.PRODUCT_STAT_BANED
		});
	}

	//加购套系
	if(cutil.defined($params.add) && cutil.defined($params.add.series) && _.isArray($params.add.series)) {
		$ids = $params.add.series;
		$ids.filter(v => (_.isString(v) && v.trim().length));

		await ProductSet.update({
			id        : $ids,
			priceType : CONST.PRODUCT_PRICE_TYPE_UNKNOWN
		}).set({
			stat      : CONST.PRODUCT_STAT_TRANS,
			priceType : CONST.PRODUCT_PRICE_TYPE_REQUIRE_ORDER
		});
	}


	//删除加购套系
	if(cutil.defined($params.del) && cutil.defined($params.del.series) && _.isArray($params.del.series)) {
		$ids = $params.del.series;
		$ids.filter(v => (_.isString(v) && v.trim().length));

		await ProductSet.update({
			id        : $ids,
			priceType : CONST.PRODUCT_PRICE_TYPE_REQUIRE_ORDER
		}).set({
			priceType : CONST.PRODUCT_PRICE_TYPE_UNKNOWN,
			stat      : CONST.PRODUCT_STAT_BANED
		});
	}
}

module.exports = {
	friendlyName: 'notify-need-product',
	description: '',
	inputs: {},

	fn: async function (inputs, exits) {
		sails.log('start need product notify process');

		let $conf = sails.config.mqApi;
		let $conn;
		let $quit = false;

		//process.once('SIGINT', function() { });

		try {
			$conn = await amqp.connect('amqp://' + $conf.user + ':' + $conf.pass + '@' + $conf.host + ':' + $conf.port);
			$conn.on('error', function($e) {
				sails.log.error('channel error: ', $e);
			});
			$conn.on('close', function() {
				$quit = true;
			});

			let $channel = await $conn.createChannel();
			let $queue = await $channel.assertQueue($conf.needDesignProductTrans.queueName, { 
				durable   : true, //持久化
			});

			await $channel.bindQueue($queue.queue, $conf.needDesignProductTrans.exchange, $conf.needDesignProductTrans.route);
			await $channel.consume($queue.queue, msg => {
				if (msg !== null) {
					try {
						let $msg = msg.content.toString();
						sails.log('notify by mq(' + msg.fields.routingKey + ')[' + moment().format('YYYY-MM-DD HH:mm:ss') + ']: ' + $msg);
						let $params = JSON.parse($msg);
						switch(msg.fields.routingKey) {
							case $conf.needDesignProductTrans.route:
								needDesignProductTransNotify($params).catch(function($e) {
									sails.log.error($e);
								});
								break;
						}
						
					} catch($e) {
						sails.log.error('msg error: ', $e);
					}

					$channel.ack(msg);
				}
			}, {
				noAck: false //需要发送处理回执，表示必须等到处理完成才能删除队列
			});
		} catch($e) {
			$conn && $conn.close();
			sails.log.error($e);

			if(
				$e.code == 'ECONNREFUSED' || //mq server down 
				$e.code == 404 || //exchange not found
				$e.code == 541 //mq server interal error
			) {
				await cutil.msleep(1000 * 60);
			}

			return exits.error($e.message);
		}

		while(true) {
			if($quit) break;

			await cutil.msleep(1000 * 2);
		}
		return exits.success('ok');
	}
};
