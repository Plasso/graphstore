/* @flow */

export default function promisify(parent: Object|Function, prop: ?string): any {
  return new Proxy(prop ? parent[prop] : parent, {
    get(target, property, receiver) {
      if (property === '__base') {
        return target;
      }
      if (typeof target[property] === 'function') {
        return promisify(target, property);
      } else {
        return target[property];
      }
    },
    apply(target, thisArg, args) {
      return new Promise((resolve, reject) => {
        if (typeof target === 'function') {
          Reflect.apply(target, parent, [...args, (err, ...more) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(...more);
          }]);
        } else {
          reject(new Error('not a function'));
        }
      });
    }
  });
}
