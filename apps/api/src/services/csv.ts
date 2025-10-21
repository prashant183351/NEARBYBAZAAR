import { parse } from 'fast-csv';
import { Readable } from 'stream';

export function parseCsvStream(stream: Readable, onRow: (row: any) => Promise<void>, onEnd: () => void, onError: (err: Error) => void) {
    stream
        .pipe(parse({ headers: true }))
        .on('data', async (row) => {
            try {
                await onRow(row);
            } catch (err) {
                onError(err as Error);
            }
        })
        .on('end', onEnd)
        .on('error', onError);
}
