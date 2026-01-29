module.exports = {


    friendlyName: 'Cache Set',


    description: 'Cache something.',


    inputs: {
        k: {
            type: 'string',
            description: 'cache key',
            required: true,
            unique: true,
            maxLength: 255,
            example: 'test:key'
        },
        expire: {
            type: 'number',
            description: 'cache expire timeval',
            defaultsTo: 86400
        }
    },


    exits: {

    },


    fn: async function (inputs, exits) {

        var $k = inputs.k;
        var $exp = inputs.expire;

        sails.getDatastore('cache').leaseConnection(function during(db, proceed) {
            db.expire($k, $exp, function (err, result){
                if (err) { return proceed(err); }

                return proceed(undefined, result);
            });
        }).exec(function (err, result){
            if (err) { return exits.error(err); }

            return exits.success(result);
        });
    }


};

