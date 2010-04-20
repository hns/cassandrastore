CASSANDRASTORE
==============

Cassandrastore is a JavaScript client for the 
[Cassandra](http://cassandra.apache.org/) distributed database
written for [RingoJS](http://ringojs.org/).

Cassandrastore is loosely based on the 
[Ruby Cassandra client](http://github.com/fauna/cassandra) and shares 
some of its concepts like automatic detection and conversion of 
UUID or Long type column names.

### Limitations

We just started out, this library is seriously incomplete.

 * get() currently only retrieves full objects from standard column families
 * remove() currently only removes full rows.

Patches and contributions are very welcome.

### Installation

Run the following command with a recent git version of RingoJS:

    ringo-admin install hns/cassandrastore

### Usage

Run `ringo` to start the Ringo shell. 

    include("ringo/cassandra");

Connect to a server and keyspace:

    var client = new Client("Keyspace1", "localhost", 9160);

Insert into a column family:

    client.insert("Standard1", "felix", {name: "Felix", age: 5});

Now get the row you just inserted:

    client.get("Standard1", "felix").toSource();

And remove it:

    client.remove("Standard1", "felix");

### License

Cassandrastore is distributed under the MIT license.

Copyright (c) 2010 Hannes Wallnoefer <hannes@helma.at>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN

