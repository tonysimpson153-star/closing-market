export type JSONCandidate = any[] | object | undefined | null | string | number | boolean;
declare function camelCaseObject(objOrArr: JSONCandidate): JSONCandidate;
export default camelCaseObject;
