import { Processor, Writer } from "@rdfc/js-runner";
import { DataFactory } from "rdf-data-factory";
import { enhanced_fetch, replicateLDES } from "ldes-client";
import { SDS } from "@treecg/types";
import { Quad_Object, Writer as NWriter } from "n3";

const df = new DataFactory();

export type LdesHarvesterArgs = {
    writer: Writer;
    url: string;
    start: Date;
    end: Date;
    interval?: number;
    amountPerInterval?: number;
    urlIsView?: boolean;
};
export class LdesHarvester extends Processor<LdesHarvesterArgs> {
    async init(this: LdesHarvesterArgs & this): Promise<void> {
        this.interval = this.interval ?? 3_600_000;
        this.amountPerInterval = this.amountPerInterval ?? 100;
        this.urlIsView = this.urlIsView ?? false;

        this.logger.info(
            `Harvesting from ${this.start.toISOString()} to ${this.end.toISOString()} with interval ${this.interval} and ${this.amountPerInterval} per interval.`,
        );
    }

    async transform(this: LdesHarvesterArgs & this): Promise<void> {
        // Nothing.
    }

    async produce(this: LdesHarvesterArgs & this): Promise<void> {
        this.logger.debug("Harvesting data");

        let date = new Date(this.start);
        while (date < this.end) {
            const ldesClient = replicateLDES({
                url: this.url,
                polling: false,
                fetch: enhanced_fetch({
                    safe: true,
                }),
                defaultTimezone: "Z",
                after: new Date(date.getTime() - 1),
                before: new Date(date.getTime() + this.interval!),
                urlIsView: this.urlIsView,
            });

            let count = 0;
            for await (const element of ldesClient.stream()) {
                if (element) {
                    count++;

                    const blank = df.blankNode();
                    const quads = element.quads.slice();
                    quads.push(
                        df.quad(
                            blank,
                            SDS.terms.stream,
                            <Quad_Object>ldesClient.streamId!,
                        ),
                        df.quad(
                            blank,
                            SDS.terms.payload,
                            <Quad_Object>element.id!,
                        ),
                    );

                    await this.writer.string(
                        new NWriter().quadsToString(quads),
                    );
                }

                if (count >= this.amountPerInterval!) {
                    this.logger.debug(
                        `Harvested ${count} elements for ${date.toISOString()} to ${new Date(date.getTime() + this.interval!).toISOString()} with IDs like ${element.id?.value}`,
                    );
                    break;
                }
            }

            date = new Date(date.getTime() + this.interval!);
        }
    }
}
