# ldes-harvester-processor-ts

[![Build and tests with Node.js](https://github.com/smessie/ldes-harvester-processor-ts/actions/workflows/build-test.yml/badge.svg)](https://github.com/smessie/ldes-harvester-processor-ts/actions/workflows/build-test.yml) [![npm](https://img.shields.io/npm/v/ldes-harvester-processor-ts.svg?style=popout)](https://npmjs.com/package/ldes-harvester-processor-ts)

This repository contains an [RDF-Connect](https://github.com/rdf-connect) processor to partially harvest an LDES with
some additional options to the ldes-client.
It allows for the harvesting of a specific number of members per interval, ranging from a specific start to end date.

## Usage

To use the `rdfc:LdesHarvester` in your RDF-Connect pipeline, you need to have a pipeline configuration that includes the
[rdfc:NodeRunner](https://github.com/rdf-connect/js-runner) (check out their documentation to find out how to install and configure it).

### Installation

```
npm install
npm run build
```

Or install from NPM:

```
npm install ldes-harvester-processor-ts
```

Next, you can add the processor to your pipeline configuration as follows:

```turtle
@prefix rdfc: <https://w3id.org/rdf-connect#>.
@prefix owl:  <http://www.w3.org/2002/07/owl#>.
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#>.

### Import the processor
<> owl:imports <./node_modules/ldes-harvester-processor-ts/processor.ttl>.

### Define the channels your processor needs
<out> a rdfc:Reader, rdfc:Writer.

### Attach the processor to the pipeline under the NodeRunner
# Add the `rdfc:processor <harvester>` statement under the `rdfc:consistsOf` statement of the `rdfc:NodeRunner`

### Define and configure the processor
<harvester> a rdfc:LdesHarvester;
    rdfc:writer <out>;
    rdfc:url "https://example.org/ldes";
    rdfc:start "2024-01-01T00:00:00Z"^^xsd:dateTime;
    rdfc:end   "2024-01-02T00:00:00Z"^^xsd:dateTime;
    rdfc:interval 3600000;
    rdfc:amountPerInterval 100;
    rdfc:urlIsView false.
```

### Configuration

Parameters of `rdfc:LdesHarvester`:

- `rdfc:writer`: The channel to which harvested LDES members will be written.
- `rdfc:url`: The URL of the LDES (or LDES view) to harvest from.
- `rdfc:start`: The start date-time of the harvesting window (xsd:dateTime).
- `rdfc:end`: The end date-time of the harvesting window (xsd:dateTime).
- `rdfc:interval`: The size of each harvesting interval in milliseconds.  
  Defaults to `3600000` (1 hour).
- `rdfc:amountPerInterval`: The maximum number of members harvested per interval.  
  Defaults to `100`.
- `rdfc:urlIsView`: Indicates whether the provided URL is an LDES view.  
  Defaults to `false`.

The harvesting process splits the time range between `start` and `end` into intervals and retrieves a limited number
of members per interval.
