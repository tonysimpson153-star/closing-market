export default function doBatch<T, R>(list: T[], work: (list: T[], batchIndex: number) => R, batchCount: number): R[];
