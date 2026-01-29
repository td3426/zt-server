
const uuidv4 = require('uuid/v4');

module.exports = {
    datastore: 'factory',
    tableName: 'transaction',

    attributes: {
        id: {
            columnName: 'transactionNo',
            type: 'string',
            maxLength: 32,
            description: '交易号',
            required: true
        },

        productType: {
            type: 'number',
            columnType: 'int(11)',
			defaultsTo: 0
        },


        productNo: {
            type: 'string',
            maxLength: 32,
            description: '商品号',
            defaultsTo: '',
            example: 'abc'
        },

        contractNo: {
            type: 'string',
            maxLength: 32,
            description: '合同号',
            defaultsTo: '',
            example: 'abc'
        },

        orderNo: {
            type: 'string',
            maxLength: 32,
            defaultsTo: '',
        },


        serialNo: {
            type: 'string',
            maxLength: 32,
            description: '进度流水号',
            defaultsTo: '',
            example: 'abc'
        },

        amount: {
            type: 'number',
            description: '交易金额，单位元',
            columnType: 'decimal(13,2)',
            example: 'abc'
        },

        saleBy: {
            type: 'number',
            description: '卖方用户ID',
            columnType: 'int(11)',
            example: 'abc'
        },

        saleByCompId: {
            type: 'number',
            description: '卖方公司ID',
            columnType: 'int(11)',
            example: 'abc'
        },

        buyBy: {
            type: 'number',
            description: '买方用户ID',
            columnType: 'int(11)',
            example: 'abc'
        },

        buyByCompId: {
            type: 'number',
            description: '买方公司ID',
            columnType: 'int(11)',
            example: 'abc'
        },

        productInfo: {
            type: 'string',
            description: '产品参数信息json',
            defaultsTo: '',
            example: 'abc'
        },

		styleNo: {
            type: 'string',
            defaultsTo: '',
		},

		name: {
            type: 'string',
            defaultsTo: '',
		},


        transactionInfo: {
            type: 'string',
            description: '交易订单信息json，[{"id":1,"range":{"start":0,"end":8},"price":0},{"id":2,"range":{"start":0,"end":14},"price":0},...]',
            defaultsTo: '',
            example: 'abc'
        },

        stat: {
            type: 'number',
            description: '状态, 0已创建，1待买方签合同，2买方已签合同，3待卖方签合同，4卖方已签合同，5买方已付款，6卖方已发货，7买方已收货，8买方已评价，9卖方已评价，10交易完成',
            columnType: 'int(11)',
            example: 'abc'
        },

        payNo: {
            type: 'string',
            maxLength: 32,
            description: '',
            defaultsTo: '',
            example: 'abc'
        },

        needBuyContractAt: {
            type: 'number',
            description: '买方发起签合同时间',
            columnType: 'bigint(20)',
            example: 'abc'
        },

        buyContractAt: {
            type: 'number',
            description: '买方签合同时间',
            columnType: 'bigint(20)',
            example: 'abc'
        },

        needSaleContractAt: {
            type: 'number',
            description: '卖方发起签合同时间',
            columnType: 'bigint(20)',
            example: 'abc'
        },
        saleContractAt: {
            type: 'number',
            description: '卖方签合同时间',
            columnType: 'bigint(20)',
            example: 'abc'
        },

        paidAt: {
            type: 'number',
            description: '买方付款时间',
            columnType: 'bigint(20)',
            example: 'abc'
        },

        shippedAt: {
            type: 'number',
            description: '卖方发货时间',
            columnType: 'bigint(20)',
            example: 'abc'
        },

        acceptedAt: {
            type: 'number',
            description: '买方收货时间',
            columnType: 'bigint(20)',
            example: 'abc'
        },

        buyRecommendAt: {
            type: 'number',
            description: '买方评价时间',
            columnType: 'bigint(20)',
            example: 'abc'
        },

        salRecommendAt: {
            type: 'number',
            description: '卖方评价时间',
            columnType: 'bigint(20)',
            example: 'abc'
        },

        completeAt: {
            type: 'number',
            description: '交易完成时间',
            columnType: 'bigint(20)',
            example: 'abc'
        }

        //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
        //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
        //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


        //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
        //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
        //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    },

    genUUID: async function($conn) {
        var id;
        var nTimes = 0;
        while(true) {
            id = uuidv4().replace(/-/g, "");

            let $exist = 0;
            if($conn)
                $exist = await Transaction.count({id: id}).usingConnection($conn);
            else
                $exist = await Transaction.count({id: id});

            if(!$exist) break;
            nTimes ++;

            if(nTimes >= 10) {
                throw new Error('生成UUID失败');
            }
        }

        return id;
    },

    genSerialUUID: async function($conn) {
        var id;
        var nTimes = 0;
        while(true) {
            id = uuidv4().replace(/-/g, "");

            let $exist = 0;
            if($conn)
                $exist = await Transaction.count({serialNo: id}).usingConnection($conn);
            else
                $exist = await Transaction.count({serialNo: id});

            if(!$exist) break;
            nTimes ++;

            if(nTimes >= 10) {
                throw new Error('生成UUID失败');
            }
        }

        return id;
    },

    getTransactions: async function($ids, $fds) {
        let $queryOpts = {
            where: {
                id: {
                    in: $ids
                }
            }
        };

        if($fds && _.isArray($fds)) {
            $queryOpts.select = $fds
        }

        let $rows = await Comp.find($queryOpts);
        let $ret = {};
        _.each($rows, function($row){
            if($fds && _.isArray($fds)) {
                let $tmp = {};
                let $i = 0, $len = $fds.length, $k;
                for(; $i < $len; $i ++) {
                    $k = $fds[$i];
                    if(typeof $row[$k] != 'undefined') {
                        $tmp[$k] = $row[$k];
                    }
                }

                $ret[$row.id] = $tmp;
            } else {
                $ret[$row.id] = $row;
            }
        });

        return $ret;
    },

    getValidTransactionsByProductNos: async function($ids, $fds) {
        let $queryOpts = {
            where: {
                productNo : $ids,
				stat      : {
					'>=': CONST.TRANSACTION_STAT_SIGNED_BUY,
					'<=': CONST.TRANSACTION_STAT_COMPLETE
				}
            }
        };

        if($fds && _.isArray($fds)) {
            $queryOpts.select = $fds
        }

        let $rows = await Transaction.find($queryOpts);
        let $ret = {};
        _.each($rows, function($row){
            if($fds && _.isArray($fds)) {
                let $tmp = {};
                let $i = 0, $len = $fds.length, $k;
                for(; $i < $len; $i ++) {
                    $k = $fds[$i];
                    if(typeof $row[$k] != 'undefined') {
                        $tmp[$k] = $row[$k];
                    }
                }

                $ret[$row.id] = $tmp;
            } else {
                $ret[$row.id] = $row;
            }
        });

        return $ret;
    }
};

