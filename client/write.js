module.exports = function(RED) {
    function NodebitWriteNode(config) {
        RED.nodes.createNode(this, config);
    }
    RED.nodes.registerType("nb-write", NodebitWriteNode);
}