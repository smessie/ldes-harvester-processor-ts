import { harvest } from "../src";
import { SimpleStream } from "@rdfc/js-runner";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { fastify, FastifyInstance } from "fastify";
import { fastifyStatic } from "@fastify/static";
import { SDS } from "@treecg/types";
import * as path from "node:path";

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
        const outputStream = new SimpleStream<string>();

        let count = 0;
        outputStream.data((record) => {
            // Check SDS metadata is present
            expect(record.indexOf(SDS.stream)).toBeGreaterThan(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThan(0);
            count++;
        });

        // Initialize the processor.
        const startHarvesting = harvest(
            outputStream,
            LDES,
            new Date("2025-04-01T00:00:00Z"),
            new Date("2025-04-02T00:00:00Z"),
            3600000,
            10,
            false,
        );
        await startHarvesting();

        // Expect all members
        expect(count).toBe(30);
    });

    test("harvesting 30 members per interval gives all 60 members in total", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        outputStream.data((record) => {
            // Check SDS metadata is present
            expect(record.indexOf(SDS.stream)).toBeGreaterThan(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThan(0);
            count++;
        });

        // Initialize the processor.
        const startHarvesting = harvest(
            outputStream,
            LDES,
            new Date("2025-04-01T00:00:00Z"),
            new Date("2025-04-02T00:00:00Z"),
            3600000,
            30,
            false,
        );
        await startHarvesting();

        // Expect all members
        expect(count).toBe(60);
    });

    test("harvesting 1 member per interval gives 3 members each at minute 00", async () => {
        const outputStream = new SimpleStream<string>();

        let count = 0;
        outputStream.data((record) => {
            // Check SDS metadata is present
            expect(record.indexOf(SDS.stream)).toBeGreaterThan(0);
            expect(record.indexOf(SDS.payload)).toBeGreaterThan(0);
            expect(record.indexOf(":00.000Z")).toBeGreaterThan(0);
            count++;
        });

        // Initialize the processor.
        const startHarvesting = harvest(
            outputStream,
            LDES,
            new Date("2025-04-01T00:00:00Z"),
            new Date("2025-04-02T00:00:00Z"),
            3600000,
            1,
            false,
        );
        await startHarvesting();

        // Expect all members
        expect(count).toBe(3);
    });
});
