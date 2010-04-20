
export("Client", "newUUID", "ConsistencyLevel");

var {TSocket} = org.apache.thrift.transport;
var {TBinaryProtocol} = org.apache.thrift.protocol;
var {Cassandra, ColumnPath, ColumnParent, ConsistencyLevel, SlicePredicate, SliceRange}
        = org.apache.cassandra.thrift;
var {GuidGenerator} = org.apache.cassandra.utils;

require("core/array");
require("core/object");
include("./cassandra/utils");

var WRITE_DEFAULTS = {
    count: 1000,
    timestamp: null,
    consistency: ConsistencyLevel.ONE
};

var READ_DEFAULTS = {
    count: 100,
    start: null,
    finish: null,
    reversed:false,
    consistency: ConsistencyLevel.ONE
};

function Client(keyspace, host, port) {

    if (!(this instanceof Client)) {
        return new Client(keyspace, host, port);
    }

    host = host || "localhost";
    port = port || 9160;
    var sock = new TSocket(host, port);
    sock.open();
    var proto = new TBinaryProtocol(sock);
    var client = new Cassandra.Client(proto);

    Object.defineProperty(this, "client", {value: client});

    var desc = new ScriptableMap(client.describe_keyspace(keyspace));

    Object.defineProperty(this, "desc", {value: desc});

    /**
     * Insert. Currently only supports Object values. Use a nested Object
     * to insert into a super column family.
     */
    this.insert = function(columnFamily, key, properties, options) {
        var {consistency, timestamp} = extractOptions(options, WRITE_DEFAULTS);
        var standard = isStandard(columnFamily);
        var mutations = [];
        var marshaller = getMarshaller(columnFamily);
        var subMarshaller = getSubMarshaller(columnFamily);
        for (var [name, value] in properties) {
            name = marshaller(name);
            mutations.push(createInsertMutation(columnFamily, name, value, timestamp,
                                                standard, subMarshaller));
        }
        var inner = {}, outer = {};
        inner[columnFamily] = java.util.Arrays.asList(mutations);
        outer[key] = inner;
        client.batch_mutate(keyspace, outer, consistency);
    };

    /**
     *  Get. Currently only supports getting an object from a standard column family.
     */
    this.get = function(columnFamily, key, options) {
        var {consistency, count} = extractOptions(options, READ_DEFAULTS);
        var parent = new ColumnParent(columnFamily);
        var range = new SliceRange(new ByteArray(), new ByteArray(), false, count);
        var predicate = new SlicePredicate();
        predicate.setSlice_range(range);
        var slice = client.get_slice(keyspace, key, parent, predicate, consistency);
        if (slice.size() == 0) {
            return null;
        }
        var result = {};
        var unmarshaller = getUnmarshaller(columnFamily);
        for each (var c in ScriptableList(slice)) {
            var column = c.getColumn();
            result[unmarshaller(column.getName())] = stringFromByteArray(column.getValue());
        }
        return result;
    };

    /**
     * Remove. Currently only supports removing an entire row from a column family.
     */
    this.remove = function(columnFamily, key, options) {
        var {consistency, timestamp} = extractOptions(options, WRITE_DEFAULTS);
        var path = new ColumnPath(columnFamily);
        var timestamp = Date.now();
        client.remove(keyspace, key, path, timestamp, consistency);
    };

    /**
     * Get a list of nodes in this cluster.
     */
    this.listNodes = function() {
        var nodes = [];
        var ring = new ScriptableList(client.describe_ring(keyspace));
        for each (var token in ring) {
            for each (var endpoint in ScriptableList(token.endpoints)) {
                if (!nodes.contains(endpoint)) {
                    nodes.push(endpoint);
                }
            }
        }
        return nodes;
    };

    function isSuper(columnFamily) {
        return desc[columnFamily].Type == "Super";
    }

    function isStandard(columnFamily) {
        return desc[columnFamily].Type == "Standard";
    }

    function getMarshaller(columnFamily) {
        return getMarshallerInternal(desc[columnFamily].CompareWith);
    }

    function getSubMarshaller(columnFamily) {
        return getMarshallerInternal(desc[columnFamily].CompareSubcolumnsWith);
    }

    function getUnmarshaller(columnFamily) {
        return getUnmarshallerInternal(desc[columnFamily].CompareWith);
    }
}

