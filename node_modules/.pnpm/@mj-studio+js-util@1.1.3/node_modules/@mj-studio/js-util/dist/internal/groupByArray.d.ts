export default function groupByArray<T, K extends string | number>(collection: T[], getKey: ((element: T) => K) | K): T[][];
