import { Writer } from "@rdfc/js-runner";
import { getLoggerFor } from "./utils/logUtil";
import { DataFactory } from "rdf-data-factory";
import { enhanced_fetch, replicateLDES } from "ldes-client";
import { SDS } from "@treecg/types";
import { Quad_Object, Writer as NWriter } from "n3";

const logger = getLoggerFor("LdesHarvester");
const df = new DataFactory();

export function harvest(
    outgoing: Writer<string>,
    url: string,
    start: Date,
    end: Date,
    interval: number = 3_600_000,
    amountPerInterval: number = 100,
    urlIsView: boolean = false,
): () => Promise<void> {
    logger.info(
        `Harvesting from ${start.toISOString()} to ${end.toISOString()} with interval ${interval} and ${amountPerInterval} per interval`,
    );

    /**************************************************************************
     * Any code that must be executed after the pipeline goes online must be  *
     * embedded in the returned function. This guarantees that all channels   *
     * are initialized and the other processors are available. A common use   *
     * case is the source processor, which introduces data into the pipeline  *
     * from an external source such as the file system or an HTTP API, since  *
     * these must be certain that the downstream processors are ready and     *
     * awaiting data.                                                         *
     *                                                                        *
     * Note that this entirely optional, and you may return void instead.     *
     **************************************************************************/
    return async () => {
        logger.debug("Harvesting data");

        let date = new Date(start);
        while (date < end) {
            const ldesClient = replicateLDES({
                url: url,
                polling: false,
                fetch: enhanced_fetch({
                    safe: true,
                }),
                defaultTimezone: "Z",
                after: new Date(date.getTime() - 1),
                before: new Date(date.getTime() + interval),
                urlIsView: urlIsView,
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

                    await outgoing.push(new NWriter().quadsToString(quads));
                }

                if (count >= amountPerInterval) {
                    logger.debug(
                        `Harvested ${count} elements for ${date.toISOString()} to ${new Date(date.getTime() + interval).toISOString()} with IDs like ${element.id?.value}`,
                    );
                    break;
                }
            }

            date = new Date(date.getTime() + interval);
        }
    };
}
