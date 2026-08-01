export declare class TimeoutHandler {
    private handlerRef;
    cleared: boolean;
    get handler(): any;
    set handler(n: any);
    clear(): void;
}
export declare function setIntervalWithTimeout(callback: (clear: () => void) => any, intervalMs: number): () => void;
