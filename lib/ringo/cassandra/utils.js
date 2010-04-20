
export("createInsertMutation",
       "extractOptions",
       "newUUID",
       "getMarshallerInternal",
       "getUnmarshallerInternal",
       "toByteArray",
       "stringFromByteArray",
       "uuidToByteArray",
       "uuidFromByteArray",
       "longToByteArray",
       "longFromByteArray");

var {Binary, ByteArray} = require("binary");
require("core/object");

var {Column, ColumnOrSuperColumn, SuperColumn, Mutation} = org.apache.cassandra.thrift;

var TimeUUID = com.eaio.uuid.UUID;
var UUID = java.util.UUID;
var ByteBuffer = java.nio.ByteBuffer;

function createInsertMutation(columnFamily, columnName, value, timestamp, standard, subMarshaller) {
    var columnOrSuper = new ColumnOrSuperColumn();
    if (standard) {
        columnOrSuper.setColumn(new Column(columnName, toByteArray(value), timestamp));
    } else {
        var superColumn = new SuperColumn();
        superColumn.setName(columnName);
        for (var [k, v] in value) {
            superColumn.addToColumns(new Column(subMarshaller(k), toByteArray(v), timestamp));
        }
        columnOrSuper.setSuperColumn(superColumn);
    }
    var mutation = new Mutation();
    mutation.setColumn_or_supercolumn(columnOrSuper);
    return mutation;
}

function extractOptions(options, defaults) {
    if (!(options instanceof Object)) {
        options = {timestamp: Date.now()};
    }
    return Object.merge(options, defaults);
}

function getMarshallerInternal(comparator) {
    switch (comparator) {
        case null:
            return null;
        case "org.apache.cassandra.db.marshal.LexicalUUIDType":
        case "org.apache.cassandra.db.marshal.TimeUUIDType":
            return uuidToByteArray;
        case "org.apache.cassandra.db.marshal.LongType":
            return longToByteArray;
        default:
            return toByteArray;
    }
}

function getUnmarshallerInternal(comparator) {
    switch (comparator) {
        case null:
            return null;
        case "org.apache.cassandra.db.marshal.LexicalUUIDType":
        case "org.apache.cassandra.db.marshal.TimeUUIDType":
            return uuidFromByteArray;
        case "org.apache.cassandra.db.marshal.LongType":
            return longFromByteArray;
        default:
            return stringFromByteArray;
    }
}

function toByteArray(value) {
    if (value instanceof Binary) {
        return value;
    } else {
        return String(value).toByteArray();
    }
}

function stringFromByteArray(value) {
    return new ByteArray(value).decodeToString("utf8");
}

function newUUID() {
    return UUID.fromString(new TimeUUID());
}

function uuidToByteArray(uuid) {
    if (!(uuid instanceof UUID)) {
        uuid = UUID.fromString(uuid);
    }
    return ByteBuffer.allocate(16)
        .putLong(uuid.getMostSignificantBits())
        .putLong(uuid.getLeastSignificantBits())
        .array();
}

function uuidFromByteArray(bytes) {
    var buffer = ByteBuffer.wrap(bytes);
    return new UUID(buffer.getLong(), buffer.getLong());
}

function longToByteArray(value) {
    return ByteBuffer.allocate(8)
        .putLong(value)
        .array();
}

function longFromByteArray(bytes) {
    return ByteBuffer.wrap(bytes).readLong();
}