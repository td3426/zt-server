
module.exports = {

    datastore: 'factory',
    tableName: 't_comp_product_saleinfo',

    attributes: {

        id: {
            columnName: 'fid',
            type: 'string',
            maxLength: 32,
            description: 'comp_product uuid',
            required: true
        },

        fsale_count: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            example: 'abc'
        },

        fsale_amount: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            example: 'abc'
        },

        forder_count: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            example: 'abc'
        },

        fvisit_count: {
            type: 'number',
            description: '',
            columnType: 'int(11)',
            example: 'abc'
        },

        createdAt: false,
        updatedAt: false

    }

};

