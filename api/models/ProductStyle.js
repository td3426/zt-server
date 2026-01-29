/**
 * Manager.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

    datastore: 'factory',
    tableName: 't_style',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
        
        id: {
            columnName: 'fid',
            type: 'string',
            description: '',
            required: true,
            maxLength: 32,
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
            type: 'string',
            description: '名称',
            maxLength: 255,
            defaultsTo: '',
            example: 'abc'
        },

        createdAt: false,
        updatedAt: false

    },

};

