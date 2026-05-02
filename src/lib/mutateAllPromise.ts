import { mutate } from 'swr';

export function mutateAllPromise(): void {
    void mutate(() => true);
}
