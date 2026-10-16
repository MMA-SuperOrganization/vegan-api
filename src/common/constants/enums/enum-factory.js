export function createEnum(entries) {
  const obj = { ...entries };
  const valuesArray = Object.freeze(Object.values(obj));

  Object.defineProperty(obj, "values", {
    value: () => valuesArray,
    writable: false,
    configurable: false,
    enumerable: false,
  });

  Object.defineProperty(obj, "list", {
    value: valuesArray,
    writable: false,
    configurable: false,
    enumerable: false,
  });

  Object.defineProperty(obj, "has", {
    value: (val) => valuesArray.includes(val),
    writable: false,
    configurable: false,
    enumerable: false,
  });

  return Object.freeze(obj);
}
