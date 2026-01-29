/**
 * Manager.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    datastore: 'factory',
    tableName: 't_cat',

    attributes: {

        id: {
            columnName: 'fid',
            type: 'number',
            description: '',
            columnType: 'int(11)',
            required: true,
            example: '0'
        },

        pid: {
            columnName: 'fparent',
            type: 'number',
            description: '父级id',
            columnType: 'int(11)',
            defaultsTo: 0,
			allowNull: true,
            example: '0'
        },
 
        order: {
            columnName: 'forder',
            type: 'number',
            columnType: 'int(11)',
            defaultsTo: 0,
			allowNull: true,
        },
        
        name: {
            columnName: 'fname',
            type: 'string',
            description: '名称',
            maxLength: 255,
            defaultsTo: '',
            example: 'abc'
        },
        
        icon: {
            columnName: 'ficon',
            type: 'string',
            maxLength: 255,
			allowNull: true,
            defaultsTo: '',
        },


        path: {
            columnName: 'fpath',
            type: 'string',
            description: '名称',
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

    },

    getAll: async function() {
        let $cat_rows = await ProductCat.find();
        let $ret = {};
        _.each($cat_rows, function($row){
			var $path = [];
			try {
				$path = JSON.parse($row.path);
			} catch(e) {
				$path = [];
			}
            $ret[$row.id] = {
                id: $row.id,
                pid: $row.pid,
                name: $row.name,
				path: $path 
            };
        });

        return $ret;
    }

};

