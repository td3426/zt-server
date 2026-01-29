/**
 * Manager.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    datastore: 'factory',
    tableName: 'product_statistics_daily',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

        productNo: {
            type: 'string',
            maxLength: 32,
            description: '商品号uuid',
            defaultsTo: '',
            example: '0'
        },

        dt: {
            type: 'number',
            description: '日期unixstamp',
            columnType: 'int(11)',
            defaultsTo: 0,
            example: '0'
        },

        nVisited: {
            type: 'number',
            description: '浏览次数',
            columnType: 'int(11)',
            defaultsTo: 0,
            example: '0'
        },

        createdBy: {
            type: 'number',
            description: '创建人ID',
            columnType: 'int(11)',
            example: 'abc'
        },

        createdByCompId: {
            type: 'number',
            description: '创建人所在公司ID',
            columnType: 'int(11)',
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

    },

    incNvisited: async function($dt, $product_id, $created_by, $created_by_comp, $conn) {
        let $product_statistics_row = await ProductStatisticsDaily
            .findOne({
                productNo: $product_id,
                dt: $dt
            })
            .usingConnection($conn);

        if($product_statistics_row) {
            await ProductStatisticsDaily
                .update({
                    id: $product_statistics_row.id
                })
                .set({
                    nVisited: $product_statistics_row.nVisited + 1
                })
                .usingConnection($conn);
        } else {
            await ProductStatisticsDaily
                .create({
                    productNo: $product_id,
                    dt: $dt,
                    nVisited: 1,
                    createdBy: $created_by,
                    createdByCompId: $created_by_comp
                })
                .usingConnection($conn);
        }
    }

};

