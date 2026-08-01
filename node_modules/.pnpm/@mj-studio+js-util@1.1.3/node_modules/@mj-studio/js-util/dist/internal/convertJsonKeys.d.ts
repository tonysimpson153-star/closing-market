export default function convertJsonKeys<T extends Record<string, unknown> | any[]>(json: T, serializedNames: {
    [P in string]: string;
}): any;
