import { expect, test, describe } from "vitest";
import { extractProcessors, extractSteps, Source } from "@rdfc/js-runner";

const pipeline = `
        @prefix js: <https://w3id.org/conn/js#>.
        @prefix : <https://w3id.org/conn#>.
        @prefix owl: <http://www.w3.org/2002/07/owl#>.
        @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

        <> owl:imports <./node_modules/@rdfc/js-runner/ontology.ttl>, <./processor.ttl>.

        [ ] a :Channel;
            :writer <outgoing>.
        <outgoing> a js:JsWriterChannel.

        [ ] a js:LdesHarvester;
            js:outgoing <outgoing>;
            js:url "https://example.org/ldes";
            js:start "2025-01-01T00:00:00Z"^^xsd:dateTime;
            js:end "2025-01-02T00:00:00Z"^^xsd:dateTime;
            js:interval 3600000;
            js:amountPerInterval 100.
    `;

describe("processor", () => {
    test("definition", async () => {
        expect.assertions(9);

        const source: Source = {
            value: pipeline,
            baseIRI: process.cwd() + "/config.ttl",
            type: "memory",
        };

        // Parse pipeline into processors.
        const {
            processors,
            quads,
            shapes: config,
        } = await extractProcessors(source);

        // Extract the Log processor.
        const env = processors.find((x) =>
            x.ty.value.endsWith("LdesHarvester"),
        )!;
        expect(env).toBeDefined();

        const args = extractSteps(env, quads, config);
        expect(args.length).toBe(1);
        expect(args[0].length).toBe(6);

        const [[outgoing, url, start, end, interval, amountPerInterval]] = args;
        expect(outgoing.ty.value).toBe(
            "https://w3id.org/conn/js#JsWriterChannel",
        );
        expect(url).toBe("https://example.org/ldes");
        expect(start).toStrictEqual(new Date("2025-01-01T00:00:00Z"));
        expect(end).toStrictEqual(new Date("2025-01-02T00:00:00Z"));
        expect(interval).toBe(3600000);
        expect(amountPerInterval).toBe(100);
    });
});
