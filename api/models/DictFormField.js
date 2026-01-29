
const uuidv4 = require('uuid/v4');

module.exports = {

    tableName: 'dict_form_field',

    attributes: {

        //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
        //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
        //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

        id: {
            type: 'string',
            maxLength: 32,
            description: 'uuid',
            required: true
        },

        formGroupId: {
            type: 'string',
            maxLength: 32,
            description: '',
            required: true
        },

        formId: {
            type: 'string',
            maxLength: 32,
            description: '',
            required: true
        },

       name: {
            type: 'string',
            description: '名称',
            maxLength: 255,
            defaultsTo: '',
            example: 'abc'
        },

       desc: {
            type: 'string',
            description: '',
            maxLength: 255,
            defaultsTo: '',
            example: 'abc'
        },

        type: {
            type: 'number',
            description: 'ID',
            columnType: 'int(11)',
			defaultsTo: 0,
            example: 'abc'
        },

       options: {
            type: 'string',
            description: '',
            defaultsTo: '',
            example: 'abc'
        },

        createdAt: false,
        updatedAt: false

    },

    genUUID: async function($conn) {
        var id;
        var nTimes = 0;
        while(true) {
            id = uuidv4().replace(/-/g, "");

            let $exist = 0;
            if($conn)
                $exist = await DictFormField.count({id: id}).usingConnection($conn);
            else
                $exist = await DictFormField.count({id: id});

            if(!$exist) break;
            nTimes ++;

            if(nTimes >= 10) {
                throw new Error('生成UUID失败');
            }
        }

        return id;
    },

};

