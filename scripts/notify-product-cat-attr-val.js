
const flaverr = require('flaverr');
const moment = require('moment');
const amqp   = require('amqplib');


async function catAttrValNotify($params) {
	if(!_.size($params)) return;

	if($params.opt == 'edit' && _.size($params.id)) {
		let $attr_no = $params.id.trim();

		let $attr_name = await sails.getDatastore().sendNativeQuery(
			`select fvalue from t_cat_attr_item where fid='${$attr_no}'`
		);
		$attr_name = _.size($attr_name) && _.size($attr_name.rows) && _.size($attr_name.rows[0]) && $attr_name.rows[0].fvalue || '';

		let $sku_attr_rows = await FactoryProductSkuAttr.find({
			valueNo: $attr_no
		});
		if(_.size($sku_attr_rows)) {
			let $tmp = {};
			for(const $sku_attr_row of $sku_attr_rows) {
				if(typeof $tmp[$sku_attr_row.skuNo] == 'undefined') $tmp[$sku_attr_row.skuNo] = [];
				$tmp[$sku_attr_row.skuNo].push({
					id      : $sku_attr_row.nameNo,
					name    : $sku_attr_row.attrName,
					valueId : $sku_attr_row.valueNo,
					value   : $attr_name
				});
			}
			$sku_attr_rows = $tmp;
		}

		await FactoryProductSkuAttr.update({
			valueNo: $attr_no
		}).set({
			attrValue: $attr_name
		});

		if(_.size($sku_attr_rows)) {
			for(const $sku_no in $sku_attr_rows) {
				let $sku_cond = JSON.stringify($sku_attr_rows[$sku_no]);
				await FactoryProductSku.update($sku_no).set({
					cond: $sku_cond
				});
			}
		}
	}
}

module.exports = {
	friendlyName: 'notify-product-cat-attr-val',
	description: '',
	inputs: {},

	fn: async function (inputs, exits) {
		sails.log('start product cat attr val notify process');

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
			let $queue = await $channel.assertQueue($conf.productCatAttrVal.queueName, { 
				durable   : true, //持久化
			});

			await $channel.bindQueue($queue.queue, $conf.productCatAttrVal.exchange, $conf.productCatAttrVal.route);
			await $channel.consume($queue.queue, msg => {
				if (msg !== null) {
					try {
						let $msg = msg.content.toString();
						sails.log('notify by mq(' + msg.fields.routingKey + ')[' + moment().format('YYYY-MM-DD HH:mm:ss') + ']: ' + $msg);
						let $params = JSON.parse($msg);
						switch(msg.fields.routingKey) {
							case 'cat.attr.value.edit': //类目属性值变更
								catAttrValNotify($params).catch(function($e) {
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
