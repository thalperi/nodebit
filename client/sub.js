module.exports = function(RED) {
    function NodebitSubscribeNode(config) {
        RED.nodes.createNode(this, config);
    }
    RED.nodes.registerType("nb-sub", NodebitSubscribeNode);
}