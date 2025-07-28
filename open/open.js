module.exports = function(RED) {
    function NodebitOpenNode(config) {
        RED.nodes.createNode(this, config);
    }
    RED.nodes.registerType("nb-open", NodebitOpenNode);
}