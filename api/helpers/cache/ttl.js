module.exports = {


    friendlyName: 'Cache Get',


    description: 'Cache something.',


    inputs: {
        k: {
            type: 'string',
            description: 'cache key',
            required: true,
            unique: true,
            maxLength: 255,
            example: 'test:key'
        }
    },


    exits: {

    },


    fn: async function (inputs, exits) {

        var $k = inputs.k;

        sails.getDatastore('cache').leaseConnection(function during(db, proceed) {
            db.ttl($k, function (err, $v){
                if (err) { return proceed(err); }

                return proceed(undefined, $v);
            });
        }).exec(function (err, $v){
            if (err) { return exits.error(err); }
            
            return exits.success($v);
        });

    }


};

