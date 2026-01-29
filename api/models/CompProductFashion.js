
module.exports = {

    datastore: 'factory',
    tableName: 'comp_product_fashion',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

        productNo: {
            type: 'string',
            maxLength: 32,
            description: '商品号uuid',
            defaultsTo: '',
        },

        color: {
            type: 'string',
            description: '',
            maxLength: 255,
            defaultsTo: '',
            allowNull: true,
            example: 'abc'
        },

        material : {
            type: 'string',
            description: '',
            maxLength: 255,
            defaultsTo: '',
            allowNull: true,
            example: 'abc'
        },

        photos : {
            type: 'string',
            description: '',
            defaultsTo: '',
            allowNull: true,
            example: 'abc'
        },


        createdAt: false,
        updatedAt: false


        //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
        //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
        //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


        //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
        //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
        //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    }

};

