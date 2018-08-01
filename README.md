# Summary

Beekeeper is a demonstration of token-tracking functionality with back-end and front-end components. 
It supports use cases in which token ownership is the starting point for data exploration.

This [live demonstration](https://vwoeltjen.github.io/beekeeper) shows a functionally similar version
using flat JSON files, in order to run as a GitHub page.

# Design

The server (`node index.js`) manages interactions between:

* The Ethereum blockchain, via web3 APIs; this is the ground truth of the data displayed.
* A PouchDB database, used to improve query performance relative to reading from the blockchain.
* The client (or clients) who use HTTP resources exposed by the server to retrieve transaction data.

When started, the server attempts to update its local database to reflect all Transfer 
events on the Bee Token from the blockchain.

Server configuration is located in this `options` object at the top of `index.js`, or read from 
a peer file named `options.json`. These options are:

* `url`: The JSON-RPC URL used to read the blockchain; development and testing used [Infura](https://infura.io)
* `contract`: The address of the ERC-20 token contract to view.
* `step`: The number of events to query for at a time, when populating the local database.
* `epoch`: The block number at which to start querying.

On success, it exposes HTTP endpoints for the data needed by the client:

* `/from` provides a JSON summary of all addresses which made a Transfer
* `/to` provides a JSON summary of all addresses which received a Transfer
* `/from/<address>` provides a JSON summary of all Transfers from this address
* `/to/<address>` provides a JSON summary of all Transfers to this address

The client (`index.html`) displays two tables: One of addresses which made transactions (`/from`), and one 
of addresses which received those transaction (`/to`). When a row is clicked, the associated Transfer
listings are queried and displayed in a third table.

# Improvements

As this is a minimal demonstration, areas for improvement specifically remain and are identified here.

Within the user interface:

* Tables used are minimal and would be more useful if replaced with a more 
  [full-featured](https://material.io/design/components/data-tables.html) library component.
  * In particular, column sorting, headers which stay visible, and progressive loading would
    improve the user experience.
* A greater variety of display modalities would be useful (e.g. charts).
* Much room remains for styling, theming, and clearer affordances.

On the server side:

* Configuration of custom [indexes](https://pouchdb.com/guides/mango-queries.html) in PouchDB
  would likely improve query performance.
* Listening for new Transfer [events](https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#contract-events) would keep data more closely up-to-date with the 
  ground truth of the blockchain.

Finally, end-to-end and component-level testing would ensure robustness and correctness;
in general, the desired strategy is to compare data provided and displayed against the
ground truth, and should also exercise various failure modes.
