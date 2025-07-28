module.exports = function(RED) {
    function NodebitEncryptNode(config) {
        RED.nodes.createNode(this, config);
    }
    RED.nodes.registerType("nb-encrypt", NodebitEncryptNode);
}