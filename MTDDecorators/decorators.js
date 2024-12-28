/**
 * @typedef OriginalMethodType
 * @typedef {(...args: any[]) => OriginalMethodType} DecoratedFunction
 * @typedef {(originalMethod: (...args: any[]) => OriginalMethodType) => DecoratedFunction} Decorator
 */

/**
 * @type {Decorator}
 */
export function logger(originalMethod) {
    return function (...args) {
        const log = (result, isAsync = false) => {
            console.log(`---> From logger: Calling ${isAsync ? 'async ' : ''}method:\t ${originalMethod.name}`);
            console.log(`---> From logger: Params:\t\t`, args);
            console.log(`---> From logger: Result:\t\t`, result, '\n');
            return result;
        }

        const result = originalMethod.apply(this, args);

        if (result instanceof Promise) {
            return result
                .then((res) => {
                    return log(res, true);
                })
                .catch((err) => {
                    console.log(`---> From logger: From '${originalMethod.name}', Caught error (async):\n`, err, '\n');
                    throw err;
                });
        }

        return log(result);
    };
}

/**
 * @type {Decorator}
 */
export function catchError(originalMethod) {
    return function (...args) {
        try {
            const result = originalMethod.apply(this, args);

            if (result instanceof Promise) {
                return result.catch((error) => {
                    console.error(`---> From catchError: Error in async method '${originalMethod.name}':`, error);
                    return 'err-from-catch-error';
                });
            }

            return result;
        } catch (error) {
            console.error(`---> From catchError: Error in method '${originalMethod.name}':`, error);
            return 'err-from-catch-error';
        }
    };
}

/**
 * Áp dụng decorators cho các method được chỉ định trong class hoặc toàn bộ các method của class.
 * @template {new (...args: any[]) => any} Class
 * @param {Class} Class - Class cần áp dụng decorators.
 * @param {(keyof InstanceType<Class>)[] | 'ALL_METHOD'} methodNames - Danh sách tên method hoặc 'ALL_METHOD' để áp dụng lên toàn bộ.
 * @param {...Decorator} decorators - Các decorators cần áp dụng.
 */
export function applyMethodDecorators(Class, methodNames, ...decorators) {
    /**
     * Các decorator hợp lệ sau khi được lọc
     */
    const validDecorators = decorators.filter((decorator) => {
        if (typeof decorator === 'function') {
            return true;
        }
        console.warn(`applyMethodDecorators warning: Có decorator được truyền vào không phải là hàm:`, decorator);
        return false;
    });

    if (validDecorators.length === 0) {
        console.warn('-> From decorator manager: No valid decorators provided. Skipping application.');
        return;
    }

    /**
     * Danh sách tên các method được áp dụng decorator
     */
    const methodNameList =
        methodNames === 'ALL_METHOD'
            ? Object.getOwnPropertyNames(Class.prototype).filter((name) => typeof Class.prototype[name] === 'function')
            : methodNames;

    // Áp dụng decorators lên danh sách method
    methodNameList.forEach((methodName) => {
        const originalMethod = Class.prototype[methodName];

        if (typeof originalMethod !== 'function') {
            console.warn(`-> From decorator manager: Method ignored:`, methodName, `is not a valid function in class.`);
            return;
        }

        // Áp dụng từng decorator, giữ nguyên decorator cũ
        Class.prototype[methodName] = [noopDecorator, ...validDecorators].reduce((decorated, decorator) => {
            const wrappedFunction = decorator(decorated);

            // Lưu lại tên class và method
            const newName = originalMethod.name.split('.').includes(Class.name)
                ? originalMethod.name
                : `${Class.name}.${originalMethod.name}`;
            Object.defineProperty(wrappedFunction, 'name', {
                value: newName, configurable: true
            });
            return wrappedFunction;
        }, originalMethod);
    });

    console.log();

    /**
     * Decorator không làm gì cả, chỉ trả về phương thức gốc.
     * @type {Decorator}
     */
    function noopDecorator(originalMethod) {
        return function (...args) {
            return originalMethod.apply(this, args);
        };
    }
}