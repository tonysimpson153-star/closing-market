type GroupByObject<T, K extends string | number> = {
    [P in K]: T[];
};
export default function groupByObject<T, K extends string | number>(collection: T[], getKey: ((element: T) => K) | K): GroupByObject<T, K>;
export {};
