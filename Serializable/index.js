/**
 * - Thư viện hỗ trợ serialize custom object
 * - Sử dụng:
 *      - Kế thừa lớp `Serializable`.
 *      - Tạo static block trong lớp kế thừa, gọi `Serializable.register(this)` để đảm bảo có thể deserialize mà không cần khởi tạo instance trước.
 *      - Cố gắng đảm bảo phiên bản class ở server và client giống nhau, có thể dùng chung bằng cách code bằng `ES6` và public thư mục để dùng chung ở cả client và server.
 * - Cảnh báo:
 *      - Chưa hỗ trợ private fields (#) với các getter, setter phức tạp. Nếu sử dụng thì khả năng lỗi gần như là chắc chắn.
 */
class Serializable {
    /**
     * @private
     * @type {Map<string, (new (...args: any[]) => any)>}
     */
    static _classRegistry = new Map();

    /**
     * @private
     * @type {any[]}
     */
    _serializeInitArgs = [];

    /**
     * @param {any[]} allChildArgs 
     */
    constructor(...allChildArgs) {
        if (new.target === Serializable) {
            throw new Error("Không thể khởi tạo trực tiếp instance của lớp Serializable");
        }

        this._validateArgs(args);
        this._serializeInitArgs = allChildArgs;
        Serializable.register(this.constructor);
    }

    /**
     * Đăng ký class vào _classRegistry để có thể deserialize
     * @param {Function} Class - Constructor của class cần đăng ký
     */
    static register(Class) {
        const className = Class.name;

        if (!className) {
            throw new Error("Cannot register a class without a name.");
        }

        if (!Serializable._classRegistry.has(className)) {
            Serializable._classRegistry.set(className, Class);
        }
    }

    /**
     * Kiểm tra và validate các tham số khởi tạo
     * @private
     * @param {any[]} args - Các tham số truyền vào constructor
     */
    _validateArgs(args) {
        for (const arg of args) {
            if (
                arg instanceof Serializable || // Custom object kế thừa Serializable
                Array.isArray(arg) || // Mảng
                arg instanceof Map || // Map
                arg instanceof Set || // Set
                arg instanceof Date || // Date
                arg instanceof RegExp || // RegExp
                arg instanceof Error || // Error
                ArrayBuffer.isView(arg) || // TypedArray
                typeof arg === "bigint" || // BigInt
                arg === undefined || // undefined
                arg === null || // null
                typeof arg !== "object" || // Kiểu cơ bản (string, number, boolean)
                (typeof arg === "object" && arg.constructor === Object) // Plain Object
            ) {
                // Cảnh báo nếu Object chứa hàm
                if (typeof arg === "object" && arg.constructor === Object) {
                    const hasFunction = Object.values(arg).some(
                        (value) => typeof value === "function"
                    );
                    if (hasFunction) {
                        console.warn(
                            `Serializable warning: Có object thuần chứa function được truyền vào constructor của lớp "${this.constructor.name}".`,
                            `Serializable không hỗ trợ tái tạo lại các hàm trong object thuần.`
                        );
                    }
                }
                continue; // Kiểu hợp lệ được pass
            } else {
                console.warn(
                    `\nSerializable log debug:`,
                    `\n*Phát hiện đối số không hợp lệ được truyền vào constructor của lớp "${this.constructor.name}":`, arg,
                    `\n*Nếu arg trên thuộc custom class do bạn tạo ra, hãy cho class đó kế thừa Serializable.`,
                    `\n*Nếu đối tượng không phải thuộc custom class thì do thư viện chưa hỗ trợ.`
                );
                throw new Error(
                    `*Serializable error: Có đối số không hợp lệ được truyền vào constructor của "${this.constructor.name}".\n` +
                    `\t*Tất cả các đối tượng thuộc custom class phải kế thừa từ Serializable.\n` +
                    `\t*Hãy xem log trên để biết đối số nào không hợp lệ.\n`
                );
            }
        }
    }

    /**
     * Serialize object thành JSON
     * @returns {string}
     */
    serialize() {
        const serializedProperties = {};
        for (const [key, value] of Object.entries(this)) {
            serializedProperties[key] = Serializable._serializeValue(value);
        }

        return JSON.stringify({
            className: this.constructor.name,
            serializeInitArgs: this._serializeInitArgs.map((arg) =>
                Serializable._serializeValue(arg)
            ),
            properties: serializedProperties,
        });
    }

    /**
     * Deserialize object từ JSON
     * @param {string} json - Chuỗi JSON cần deserialize
     * @returns {Serializable}
     */
    static deserialize(json) {
        let parsed;
        try {
            parsed = JSON.parse(json);
        } catch (e) {
            throw new Error("Invalid JSON string provided.");
        }

        const { className, serializeInitArgs, properties } = parsed;

        const Class = Serializable._classRegistry.get(className);

        if (!Class) {
            throw new Error(`Class "${className}" not found in registry.`);
        }

        const deserializedArgs = serializeInitArgs.map((arg) =>
            Serializable._deserializeValue(arg)
        );

        const instance = new Class(...deserializedArgs);

        for (const [key, value] of Object.entries(properties)) {
            instance[key] = Serializable._deserializeValue(value);
        }

        return instance;
    }

    /**
     * Serialize một giá trị, hỗ trợ phát hiện Circular References
     * @private
     * @param {any} value - Giá trị cần serialize
     * @returns {any}
     */
    static _serializeValue(value) {
        const seen = new WeakMap(); // Khởi tạo WeakMap nội bộ
        const refId = { current: 0 }; // Khởi tạo refId nội bộ

        function recursiveSerialize(value) {
            if (value instanceof Serializable) {
                if (seen.has(value)) {
                    return { __type: "ref", id: seen.get(value) }; // Trả về tham chiếu nếu đã thấy
                }
                const id = refId.current++;
                seen.set(value, id);
                return { __type: "Serializable", id, data: value.serialize() };
            } else if (Array.isArray(value)) {
                return { __type: "Array", data: value.map(recursiveSerialize) };
            } else if (value instanceof Map) {
                return {
                    __type: "Map",
                    data: Array.from(value.entries()).map(([k, v]) => [
                        recursiveSerialize(k),
                        recursiveSerialize(v),
                    ]),
                };
            } else if (value instanceof Set) {
                return {
                    __type: "Set",
                    data: Array.from(value).map(recursiveSerialize),
                };
            } else if (ArrayBuffer.isView(value)) {
                return {
                    __type: "TypedArray",
                    constructor: value.constructor.name,
                    data: Array.from(value),
                };
            } else if (value instanceof Date) {
                return { __type: "Date", data: value.toISOString() };
            } else if (value instanceof RegExp) {
                return { __type: "RegExp", source: value.source, flags: value.flags };
            } else if (value instanceof Error) {
                return {
                    __type: "Error",
                    name: value.name,
                    message: value.message,
                    stack: value.stack,
                };
            } else if (typeof value === "bigint") {
                return { __type: "BigInt", data: value.toString() };
            } else if (value === undefined) {
                return { __type: "undefined" };
            } else if (value === null || typeof value !== "object") {
                return value;
            } else if (typeof value === "object" && value.constructor === Object) {
                if (seen.has(value)) {
                    return { __type: "ref", id: seen.get(value) };
                }
                const id = refId.current++;
                seen.set(value, id);
                const serializedObject = {};
                for (const [key, val] of Object.entries(value)) {
                    serializedObject[key] = recursiveSerialize(val);
                }
                return { __type: "Object", id, data: serializedObject };
            } else {
                console.log(`Serializable log debug: Serializable hiện chưa hỗ trợ kiểu '${typeof value}' của:`, value);
                throw new Error(
                    `Serializable error: Lỗi khi serialize: Serializable hiện chưa hỗ trợ kiểu: ${typeof value}.
                    Kiểm tra log debug để xem value có kiểu không được hỗ trợ`
                );
            }
        }

        return recursiveSerialize(value);
    }

    /**
     * Deserialize một giá trị, hỗ trợ phát hiện Circular References
     * @private
     * @param {any} value - Giá trị cần deserialize
     * @returns {any}
     */
    static _deserializeValue(value) {
        const references = new Map(); // Khởi tạo Map nội bộ để theo dõi tham chiếu

        function deserializeInternal(value) {
            if (value && typeof value === "object" && "__type" in value) {
                switch (value.__type) {
                    case "ref":
                        return references.get(value.id);
                    case "Serializable":
                        const instance = Serializable.deserialize(value.data);
                        references.set(value.id, instance);
                        return instance;
                    case "Array":
                        const deserializedArray = value.data.map(deserializeInternal);
                        references.set(value.id, deserializedArray);
                        return deserializedArray;
                    case "Map":
                        const deserializedMap = new Map(
                            value.data.map(([k, v]) => [
                                deserializeInternal(k),
                                deserializeInternal(v),
                            ])
                        );
                        references.set(value.id, deserializedMap);
                        return deserializedMap;
                    case "Set":
                        const deserializedSet = new Set(value.data.map(deserializeInternal));
                        references.set(value.id, deserializedSet);
                        return deserializedSet;
                    case "Date":
                        return new Date(value.data);
                    case "RegExp":
                        return new RegExp(value.source, value.flags);
                    case "Error":
                        const error = new Error(value.message);
                        error.name = value.name;
                        error.stack = value.stack;
                        return error;
                    case "TypedArray":
                        const TypedArrayConstructor = globalThis[value.constructor];
                        return new TypedArrayConstructor(value.data);
                    case "BigInt":
                        return BigInt(value.data);
                    case "undefined":
                        return undefined;
                    case "Object":
                        const deserializedObject = {};
                        references.set(value.id, deserializedObject);
                        for (const [key, val] of Object.entries(value.data)) {
                            deserializedObject[key] = deserializeInternal(val);
                        }
                        return deserializedObject;
                    default:
                        console.log(`Serializable log debug: Serializable hiện chưa hỗ trợ kiểu '${value.__type}' của:`, value);
                        throw new Error(
                            `Serializable error: Lỗi khi deserialize: Serializable hiện chưa hỗ trợ kiểu: ${value.__type}
                            Kiểm tra log debug để xem value có kiểu không được hỗ trợ`
                        );
                }
            } else {
                return value;
            }
        }

        return deserializeInternal(value);
    }
}