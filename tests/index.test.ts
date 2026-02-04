import { LdesHarvester } from "../src";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { fastify, FastifyInstance } from "fastify";
import { fastifyStatic } from "@fastify/static";
import { SDS } from "@treecg/types";
import * as path from "node:path";
import { channel, createRunner } from "@rdfc/js-runner/lib/testUtils";
import { FullProc } from "@rdfc/js-runner";
import { createLogger } from "winston";

describe("harvest", () => {
    const LDES = "http://localhost:3000/mock-ldes.ttl";

    let server: FastifyInstance;

    beforeAll(async () => {
        // Setup mock http server
        try {
            server = fastify();
            server.register(fastifyStatic, {
                root: path.join(__dirname, "./data/mock-ldes"),
            });

            await server.listen({ port: 3000 });
            console.log(
                `Mock server listening on ${server.addresses()[0].port}`,
            );
        } catch (err) {
            server.log.error(err);
            process.exit(1);
        }
    });

    afterAll(async () => {
        await server.close();
    });

    test("harvesting 10 members per interval gives 30 members in total", async () => {
        const runner = createRunner();
        const [writer, reader] = channel(runner, "outgoing");

        let count = 0;
        (async () => {
            for await (const data of reader.strings()) {
                // Check SDS metadata is present
                expect(data.indexOf(SDS.stream)).toBeGreaterThan(0);
                expect(data.indexOf(SDS.payload)).toBeGreaterThan(0);
                count++;
            }
        })().then();

        // Initialize the processor.
        const startHarvesting = <FullProc<LdesHarvester>>new LdesHarvester(
            {
                writer: writer,
                url: LDES,
                start: new Date("2025-04-01T00:00:00Z"),
                end: new Date("2025-04-02T00:00:00Z"),
                interval: 3600000,
                amountPerInterval: 10,
                urlIsView: false,
            },
            createLogger(),
        );
        await startHarvesting.init();

        const outputPromise = Promise.all([
            startHarvesting.transform(),
            startHarvesting.produce(),
        ]);

        // Nothing to push, as LdesHarvester consumes from the LDES directly.

        // Wait for the processor to finish.
        await outputPromise;

        // Expect all members
        expect(count).toBe(30);
    });

    test("harvesting 30 members per interval gives all 60 members in total", async () => {
        const runner = createRunner();
        const [writer, reader] = channel(runner, "outgoing");

        let count = 0;
        (async () => {
            for await (const data of reader.strings()) {
                // Check SDS metadata is present
                expect(data.indexOf(SDS.stream)).toBeGreaterThan(0);
                expect(data.indexOf(SDS.payload)).toBeGreaterThan(0);
                count++;
            }
        })().then();

        // Initialize the processor.
        const startHarvesting = <FullProc<LdesHarvester>>new LdesHarvester(
            {
                writer: writer,
                url: LDES,
                start: new Date("2025-04-01T00:00:00Z"),
                end: new Date("2025-04-02T00:00:00Z"),
                interval: 3600000,
                amountPerInterval: 30,
                urlIsView: false,
            },
            createLogger(),
        );
        await startHarvesting.init();

        const outputPromise = Promise.all([
            startHarvesting.transform(),
            startHarvesting.produce(),
        ]);

        // Nothing to push, as LdesHarvester consumes from the LDES directly.

        // Wait for the processor to finish.
        await outputPromise;

        // Expect all members
        expect(count).toBe(60);
    });

    test("harvesting 1 member per interval gives 3 members each at minute 00", async () => {
        const runner = createRunner();
        const [writer, reader] = channel(runner, "outgoing");

        let count = 0;
        (async () => {
            for await (const data of reader.strings()) {
                // Check SDS metadata is present
                expect(data.indexOf(SDS.stream)).toBeGreaterThan(0);
                expect(data.indexOf(SDS.payload)).toBeGreaterThan(0);
                expect(data.indexOf(":00.000Z")).toBeGreaterThan(0);
                count++;
            }
        })().then();

        // Initialize the processor.
        const startHarvesting = <FullProc<LdesHarvester>>new LdesHarvester(
            {
                writer: writer,
                url: LDES,
                start: new Date("2025-04-01T00:00:00Z"),
                end: new Date("2025-04-02T00:00:00Z"),
                interval: 3600000,
                amountPerInterval: 1,
                urlIsView: false,
            },
            createLogger(),
        );
        await startHarvesting.init();

        const outputPromise = Promise.all([
            startHarvesting.transform(),
            startHarvesting.produce(),
        ]);

        // Nothing to push, as LdesHarvester consumes from the LDES directly.

        // Wait for the processor to finish.
        await outputPromise;

        // Expect all members
        expect(count).toBe(3);
    });
});
