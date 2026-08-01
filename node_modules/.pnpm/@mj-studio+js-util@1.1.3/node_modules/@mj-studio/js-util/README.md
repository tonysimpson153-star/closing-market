## JavaScript utilities for MJ Studio

![ogimage-1260-630](https://github.com/mj-studio-library/js-util/assets/33388801/9d345b3c-0353-4cec-b055-d5c018ec68a2)

![JS Check](https://github.com/mym0404/mj-studio-js-util/workflows/JS%20Check/badge.svg)

---
### Install

```
yarn add @mj-studio/js-util
npm install @mj-studio/js-util
```

---
### Usage

* `isPromise` : check is promise
* `isPlainObject` : check is plain object
* `camelCase` : convert snake_case string to camelCase
* `camelCaseObject` : convert keys of object to camelCased 
* `convertJsonKeys` : convert keys of json object to something others
* `replaceJsonKeysRecursively` : replace json value matchs with key selector
* `replaceJsonValuesRecursively` : replace json key matches with key selector
* `filterJsonKeys` : filter keys of json object to something others
* `reverseObjectKeyValues` : reverse key and value in object
* `groupByArray` : group object as arrays with key a provider callback
* `groupByObject` : group object as objects with key a provider callback
* `doBatch` : with list, do something with batched manner and return results of callback as a list
* And.. other things!

#### Promise helper
* `withTimeout` : set max running time of promise, if exceeds it will reject.
* `withMinimumResolveTime` : set minimum running time of promise
