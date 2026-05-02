export type PromiseState<T> =
    | { status: 'pending' }
    | { status: 'resolved'; resource: T }
    | { status: 'rejected'; error: unknown };

export function isPromiseResolved<T>(
    state: PromiseState<T>,
): state is { status: 'resolved'; resource: T } {
    return state.status === 'resolved';
}
