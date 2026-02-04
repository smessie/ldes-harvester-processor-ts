import { describe, expect, test } from "vitest";
import { WriterInstance } from "@rdfc/js-runner";
import { ProcHelper } from "@rdfc/js-runner/lib/testUtils";
import { LdesHarvester, LdesHarvesterArgs } from "../src";
import { resolve } from "path";

const pipeline = `
        @prefix rdfc: <https://w3id.org/rdf-connect#>.
        @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

        <http://example.org/harvester> a rdfc:LdesHarvester;
            rdfc:writer <writer>;
            rdfc:url "https://example.org/ldes";
            rdfc:start "2025-01-01T00:00:00Z"^^xsd:dateTime;
            rdfc:end "2025-01-02T00:00:00Z"^^xsd:dateTime;
            rdfc:interval 3600000;
            rdfc:amountPerInterval 100;
            rdfc:urlIsView false.
    `;

describe("processor", () => {
    test("definition", async () => {
        expect.assertions(10);

        const helper = new ProcHelper<LdesHarvester>();

        await helper.importFile(resolve("./processor.ttl"));
        await helper.importInline(resolve("./pipeline.ttl"), pipeline);

        const config = helper.getConfig("LdesHarvester");

        expect(config.location).toBeDefined();
        expect(config.clazz).toBe("LdesHarvester");
        expect(config.file).toBeDefined();

        const proc = <LdesHarvester & LdesHarvesterArgs>(
            await helper.getProcessor("http://example.org/harvester")
        );

        expect(proc.writer.constructor.name).toBe("WriterInstance");
        expect(proc.url).toBe("https://example.org/ldes");
        expect(proc.start).toStrictEqual(new Date("2025-01-01T00:00:00Z"));
        expect(proc.end).toStrictEqual(new Date("2025-01-02T00:00:00Z"));
        expect(proc.interval).toBe(3600000);
        expect(proc.amountPerInterval).toBe(100);
        expect(proc.urlIsView).toBe(false);
    });
});
