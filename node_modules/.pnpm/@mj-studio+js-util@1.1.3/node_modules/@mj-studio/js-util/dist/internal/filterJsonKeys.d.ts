import type { JSONCandidate } from './camelCaseObject';
type Filter = ((key: string) => boolean) | string[] | string;
export default function filterJsonKeys(x: JSONCandidate, filter: Filter): JSONCandidate;
export {};
