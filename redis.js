const redis = require("redis");
const { promisify } = require("util");

const client = redis.createClient({
    host: "Localhost",
    port: 6379,
});

module.exports.set = promisify(client.set).bind(client);
module.exports.get = promisify(client.get).bind(client);
module.exports.setex = promisify(client.setex).bind(client);
module.exports.del = promisify(client.del).bind(client);

/* client.on("error", function (err) {
    console.log(err);
});

client.set("name", "Layla", (err, data) => {
    console.log("set 'name' to Layla: ",, data);
});

client.get('name', (err, data) => {
    console.log("get 'name' from redis", data);
});

client.get("name", (err, data) => {
    console.log(("get 'name' after deleting it", data));
})
 */
