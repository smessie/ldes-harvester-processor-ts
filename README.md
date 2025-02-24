# ldes-harvester-processor-ts

[![Build and tests with Node.js](https://github.com/smessie/ldes-harvester-processor-ts/actions/workflows/build-test.yml/badge.svg)](https://github.com/smessie/ldes-harvester-processor-ts/actions/workflows/build-test.yml) [![npm](https://img.shields.io/npm/v/ldes-harvester-processor-ts.svg?style=popout)](https://npmjs.com/package/ldes-harvester-processor-ts)

This repository contains an [RDF-Connect](https://github.com/rdf-connect) processor to partially harvest an LDES with
some additional options to the ldes-client.
It allows for the harvesting of a specific number of members per interval, ranging from a specific start to end date.

## Configuration

At the time of writing, this repositories sets up the following boilerplate and tools for you.

- `outgoing`: The outgoing channel to write the harvested members to.
- `url`: The URL of the LDES to harvest.
- `start`: The start date of the harvesting interval.
- `end`: The end date of the harvesting interval.
- `interval`: The number of milliseconds in each interval. Default is 3_600_000ms (1 hour).
- `membersPerInterval`: The number of members to harvest per interval. Default is 100.
- `urlIsView`: Whether the URL is a view or not. Default is false.

## Installation

```
npm install
npm run build
```

## Example

An example configuration of the processor can be found in the `example` directory.

You can run this example by executing the following command:

```bash
npx @rdfc/js-runner example/pipeline.ttl
```

To enable all debug logs, add `DEBUG=*` before the command:

```bash
DEBUG=* npx @rdfc/js-runner example/pipeline.ttl
```
