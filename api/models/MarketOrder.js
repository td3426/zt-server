
module.exports = {
    tableName: 'market_order',
    attributes: {
        order_id: {
            type: 'string',
            maxLength: 36,
            defaultsTo: '',
			allowNull: true,
        },

        waybill_num: {
            type: 'string',
            maxLength: 64,
            defaultsTo: '',
			allowNull: true,
        },

        waybill: {
            type: 'string',
			allowNull: true,
        },

    },

};

