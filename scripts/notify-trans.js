
const flaverr = require('flaverr');
const moment = require('moment');
const amqp   = require('amqplib');


async function checkPaidPriceProduct($trans_row) {
	let $event_add_spu = [];
	let $mes_spu = [];
	try {
		await sails.getDatastore('factory').transaction(async (db, proceed) => {
			try {
				let $product_rows = [];
				let $set_row = {};
				if($trans_row.productType == CONST.TRANSACTION_PRODUCT_TYPE_SET) {
					let $sub_set_rows = await ProductSet.find({
						or: [
							{ id: $trans_row.productNo },
							{ pid: $trans_row.productNo },
						]
					});
					let $sub_set_ids = cutil.getTabCol($sub_set_rows, 'id');
					$sub_set_rows = cutil.indexTabByCol($sub_set_rows, 'id');
					$set_row = _.size($sub_set_rows) && _.size($sub_set_rows[$trans_row.productNo]) && $sub_set_rows[$trans_row.productNo] || {};
					$product_rows = await DesignProduct.find({
						setNo                 : _.values($sub_set_ids),
						designParentProductNo : '-'
					});
				} else if($trans_row.productType == CONST.TRANSACTION_PRODUCT_TYPE_PRODUCT) {
					$product_rows = await DesignProduct.find({
						id: $trans_row.productNo
					});
				}

				if(!_.size($product_rows)) throw '商品不存在';

				for(let $product_row of $product_rows) {
					let $acc_product_rows = await DesignProduct.find({
						designParentProductNo: $product_row.id
					});

					let productNo;
					try{
						productNo = await FactoryProduct.genUUID(db);
					} catch($e) {
						throw new Error('生成商品UUID失败');
					}

					let productSN;
					try{
						productSN = await FactoryProduct.genSN($trans_row.buyByCompId, db);
					} catch($e) {
						throw new Error('生成商品编码失败');
					}

					let $factory_product_row = await FactoryProduct.create({
						id                     : productNo,
						designProductNo        : $product_row.id,
						factoryParentProductNo : '-',
						designParentProductNo  : $product_row.designParentProductNo,
						factoryProductSN       : productSN,
						name                   : $product_row.name,
						sname                  : $product_row.sname || $product_row.name,
						priceType              : $trans_row.productType == CONST.TRANSACTION_PRODUCT_TYPE_SET ? $set_row.priceType : $product_row.priceType,
						styleNo                : $trans_row.productType == CONST.TRANSACTION_PRODUCT_TYPE_SET ? $set_row.styleNo : $product_row.styleNo,
						catId                  : $product_row.catId,
						designIdea             : $product_row.designIdea,
						photoRender            : $product_row.photoRender,
						photoCad               : $product_row.photoCad,
						intro                  : $product_row.intro,
						dimension              : $product_row.dimension,
						photoSize              : $product_row.photoSize,
						photoStory             : $product_row.photoStory,
						price                  : $product_row.price,
						pricePercent           : $product_row.pricePercent,
						transactionNo          : $trans_row.id,
						contractNo             : $trans_row.contractNo,
						stat                   : CONST.PRODUCT_STAT_BANED,
						marketPublish          : CONST.PRODUCT_MARMET_STAT_BAND,
						salebookPublish        : CONST.PRODUCT_MARMET_STAT_BAND,
						designerUserId         : $product_row.createdBy,
						designerCompId         : $product_row.createdByCompId,
						factoryUserId          : $trans_row.buyBy,
						factoryCompId          : $trans_row.buyByCompId
					}).fetch().usingConnection(db);
					$event_add_spu.push($factory_product_row);
					$mes_spu.push($factory_product_row.id);

					let $design_spu_attr_rows = await DesignProductAttr.find({
						designCompId    : $product_row.createdByCompId,
						designProductNo : $product_row.id
					});
					let $factory_spu_attr_set = [];
					_.each($design_spu_attr_rows, function($attr_row) {
						$factory_spu_attr_set.push({
							factoryCompId    : $trans_row.buyByCompId,
							factoryProductNo : productNo,
							nameNo           : $attr_row.nameNo,
							valueNo          : $attr_row.valueNo
						});
					});
					if(_.size($factory_spu_attr_set)) await FactoryProductAttr.createEach($factory_spu_attr_set);

					if($acc_product_rows && _.size($acc_product_rows)) {
						let $acc_sets = [];
						for(let $acc_product_row_idx in $acc_product_rows) {
							let $acc_product_row = $acc_product_rows[$acc_product_row_idx];
							let acc_set_row = {
								designProductNo        : $acc_product_row.id,
								factoryParentProductNo : $factory_product_row.id,
								designParentProductNo  : $acc_product_row.designParentProductNo,
								name                   : $acc_product_row.name,
								sname                   : $acc_product_row.sname || $acc_product_row.name,
								priceType              : $acc_product_row.priceType,
								styleNo                : $acc_product_row.styleNo,
								catId                  : $acc_product_row.catId,
								designIdea             : $acc_product_row.designIdea,
								photoRender            : $acc_product_row.photoRender,
								photoCad               : $acc_product_row.photoCad,
								intro                  : $acc_product_row.intro,
								dimension              : $acc_product_row.dimension,
								photoSize              : $acc_product_row.photoSize,
								photoStory             : $acc_product_row.photoStory,
								price                  : $acc_product_row.price,
								pricePercent           : $acc_product_row.pricePercent,
								transactionNo          : $trans_row.id,
								contractNo             : $trans_row.contractNo,
								stat                   : CONST.PRODUCT_STAT_BANED,
								marketPublish          : CONST.PRODUCT_MARMET_STAT_BAND,
								salebookPublish        : CONST.PRODUCT_MARMET_STAT_BAND,
								designerUserId         : $acc_product_row.createdBy,
								designerCompId         : $acc_product_row.createdByCompId,
								factoryUserId          : $trans_row.buyBy,
								factoryCompId          : $trans_row.buyByCompId
							};

							try{
								acc_set_row.id = await FactoryProduct.genUUID(db);
							} catch($e) {
								throw new Error('生成商品UUID失败');
							}
							$mes_spu.push(acc_set_row.id);

							try{
								acc_set_row.factoryProductSN = await FactoryProduct.genSN($trans_row.buyByCompId, db);
							} catch($e) {
								throw new Error('生成商品编码失败');
							}

							$acc_sets.push(acc_set_row);
						}

						if(_.size($acc_sets)) {
							let $acc_rows = await FactoryProduct.createEach($acc_sets).fetch().usingConnection(db);
							$event_add_spu = $event_add_spu.concat($acc_rows);
						}
					}
				}

				return proceed(undefined, 'ok');
			} catch (err) {
				return proceed(flaverr('E_USER_ERROR', new Error(err)));
			}
		});
	} catch ($e) {
		sails.log.error($e);
		throw $e;
	}

	try {
		if($mes_spu && _.size($mes_spu)) {
			for(let $mes_idx in $mes_spu) {
				let $mes_id = $mes_spu[$mes_idx];
				await FactoryProduct.addSpuToMes($mes_id);
			}
		}
	} catch($e) {
		sails.log.error($e);
		throw $e;
	}

	try {
		const mq = new MqApi();
		await mq.startTrans(sails.config.mqApi.product.exchange);
		for(let $_idx_spu in $event_add_spu) {
			let $spu_row = $event_add_spu[$_idx_spu];
			await mq.tranSend(sails.config.mqApi.product.routeSpuAdd, {id: $spu_row.id});
		}
		await mq.endTrans();
	} catch($e) {
		sails.log.error($e);
		throw $e;
	}
}


async function priceProductOrderNotify($params) {
	//{
	//	id:"交易订单id",   
	//	bizOrderId:"业务订单id",   
	//	state:0 //0等待对方签约，2买方已签合同，4卖方已签合同，5买方已全部付款，6卖方确认收款   
	//}

	//let $order_no = cutil.getReq(req, 'id');
	//let $trans_no = cutil.getReq(req, 'bizOrderId');
	//let $stat = parseInt(cutil.getReq(req, 'state')) || 0;

	let $order_no = $params.id;
	let $trans_no = $params.bizOrderId;
	let $stat     = parseInt($params.state) || 0;
	if([2, 4, 5, 6].indexOf($stat) === -1) {
		sails.log.error('priceProductOrderNotify: 状态未定义', $params);
	}

	if(!_.size($order_no) || !_.size($trans_no)) throw '订单编号为空';

	let $trans_row = await Transaction.findOne($trans_no);
	if(!_.size($trans_row)) throw '交易信息不存在';
	if($trans_row.orderNo != $order_no) throw '订单编号不匹配';
	if(!$trans_row.productNo.length) {
		sails.log.error('priceProductOrderNotify: 商品id不存在', $trans_row);
		return 'ok';
	}

	$trans_row.stat = parseInt($trans_row.stat);
	if($trans_row.stat >= $stat) return 'ok';

	let $tm = moment().valueOf();
	let $trans_set = {
		stat: $stat
	};
	if($stat == CONST.TRANSACTION_STAT_SIGNED_BUY) $trans_set.buyContractAt = $tm;
	else if($stat == CONST.TRANSACTION_STAT_SIGNED_SELL) $trans_set.saleContractAt = $tm;

	try {
		await sails.getDatastore('factory').transaction(async (db, proceed) => {
			try {
				if($stat == CONST.TRANSACTION_STAT_SIGNED_BUY) {
					//版权购买，买方签约具有排他性，只能允许一个买方成功
					let $is_stock_ok = 0;
					if($trans_row.productType == CONST.TRANSACTION_PRODUCT_TYPE_PRODUCT) {
						$is_stock_ok = await sails.getDatastore().sendNativeQuery(
							"update design_product set stock=stock-1, stat=" + CONST.PRODUCT_STAT_TRANS + " where designProductNo='" + $trans_row.productNo + "' and stock=1"
						);
						$is_stock_ok = _.size($is_stock_ok) && $is_stock_ok.affectedRows || 0;
					} else if($trans_row.productType == CONST.TRANSACTION_PRODUCT_TYPE_SET) {
						$is_stock_ok = await sails.getDatastore().sendNativeQuery(
							"update product_set set stock=stock-1, stat=" + CONST.PRODUCT_STAT_TRANS + " where setNo='" + $trans_row.productNo + "' and stock=1"
						);
						$is_stock_ok = _.size($is_stock_ok) && $is_stock_ok.affectedRows || 0;
					}
					if(!$is_stock_ok) return proceed(undefined, 'ok');

					await Transaction.update({
						productType : $trans_row.productType,
						productNo   : $trans_row.productNo,
					}).set({
						stat: CONST.TRANSACTION_STAT_STOCK_EMPTY
					}).usingConnection(db);
				}

				await Transaction.update($trans_no).set($trans_set).usingConnection(db);

				return proceed(undefined, 'ok');
			} catch (err) {
				return proceed(err);
			}
		});
	} catch ($e) {
		sails.log.error($e);
		throw '写入数据失败';
	}

	if($stat == CONST.TRANSACTION_STAT_PAID_OK) {
		try {
			await checkPaidPriceProduct($trans_row);
		} catch($e) {}
	}

	return 'ok';
}

module.exports = {
	friendlyName: 'notify-trans',
	description: '',
	inputs: {},

	fn: async function (inputs, exits) {
		sails.log('start trans notify process');

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
			let $queue = await $channel.assertQueue($conf.trans.queueName, { 
				durable   : true, //持久化
			});

			await $channel.bindQueue($queue.queue, $conf.trans.exchange, $conf.trans.routeDesignProductOrderStatChange); //订单状态变更

			await $channel.consume($queue.queue, msg => {
				if (msg !== null) {
					try {
						let $msg = msg.content.toString();
						sails.log('notify by mq(' + msg.fields.routingKey + ')[' + moment().format('YYYY-MM-DD HH:mm:ss') + ']: ' + $msg);
						let $params = JSON.parse($msg);
						switch(msg.fields.routingKey) {
							case $conf.trans.routeDesignProductOrderStatChange:
								priceProductOrderNotify($params).catch(function($e) {
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
