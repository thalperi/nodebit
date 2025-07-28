module.exports = function(RED) {
    function NodebitReadNode(config) {
        RED.nodes.createNode(this, config);
    }
    RED.nodes.registerType("nb-read", NodebitReadNode);
}