/**
 * Thư viện tiện ích hỗ trợ query và làm việc với DOM.
 */
export default class DOMQuery {
    /**
     * @private
     * @static
     * @type {HTMLElement | Document}
     * Phần tử HTML root dùng để query
     */
    static _root = undefined;

    /**
     * - Xác định phần tử root để query trong lần gọi query kế tiếp. Nếu không xác định, sẽ tự dùng document làm root
     * - Ví dụ sử dụng: `DOM_Query.from(...).query(...)`
     * @param {HTMLElement} element 
     * @returns {typeof DOMQuery}
     */
    static from(element) {
        DOMQuery._root = element;
        return DOMQuery;
    }

    /**
     * @private
     * @static
     * - Hàm khởi tạo root trong trường hợp là lần query đầu tiên
     */
    static _initRoot() {
        if (!DOMQuery._root) DOMQuery._root = document;
    }

    /**
     * @private
     * @static
     * - Hàm đưa root trở lại trạng thái ban đầu
     */
    static _resetRoot() {
        if (DOMQuery._root !== document) DOMQuery._root = undefined;
    }

    /**
     * @template {typeof HTMLElement} T
     * @param {keyof HTMLElementTagNameMap | string} selector - Selector của phần tử, hỗ trợ gợi ý tên thẻ
     * @param {T} [Type=HTMLElement] - Kiểu phần tử mong muốn, mặc định là `HTMLElement`
     * @return {T['prototype']} Phần tử được `querySelector` tìm thấy và được ép kiểu
     * @throws {Error} Nếu phần tử HTML được tìm thấy có kiểu mâu thuẫn với `Type` mong muốn hoặc lỗi do `querySelector` ném ra
     */
    static query(selector, Type = HTMLElement) {
        DOMQuery._initRoot();
        let element;

        try {
            element = DOMQuery._root.querySelector(selector);
        } catch (error) {
            throw new Error(`DOMQuery error: Lỗi khi thực hiện 'query' với selector '${selector}': ${error.message}`);
        }

        if (element && !(element instanceof Type)) {
            console.error(`DOMQuery log debug: Phần tử với selector '${selector}' không thuộc kiểu '${Type.name}':`, element);
            throw new Error(`DOMQuery error: Phần tử với selector '${selector}' không thuộc kiểu '${Type.name}' như mong muốn. Kiểm tra log ở trên.`);
        }

        DOMQuery._resetRoot();
        return element;
    }

    /**
     * @template {typeof HTMLElement} T
     * @param {string} selector - Selector của phần tử
     * @param {T} [Type=HTMLElement] - Kiểu phần tử mong muốn, mặc định là `HTMLElement`
     * @return {T['prototype']} Phần tử được `getElementById` tìm thấy và được ép kiểu
     * @throws {Error} Nếu phần tử HTML được tìm thấy có kiểu mâu thuẫn với `Type` mong muốn hoặc lỗi do `getElementById` ném ra
     */
    static queryById(selector, Type = HTMLElement) {
        DOMQuery._initRoot();
        let element;

        try {
            if (DOMQuery._root instanceof Document) {
                element = DOMQuery._root.getElementById(selector);
            } else {
                throw new Error('`queryById` chỉ dùng được với root là `document`. Nếu muốn truy vấn theo id với root khác, hãy dùng `query` với selector có #');
            }
        } catch (error) {
            throw new Error(`DOMQuery error: Lỗi khi thực hiện 'queryById' với id '${selector}': ${error.message}`);
        }

        if (element && !(element instanceof Type)) {
            console.error(`DOMQuery log debug: Phần tử với id '${selector}' không thuộc kiểu '${Type.name}':`, element);
            throw new Error(`DOMQuery error: Phần tử với id '${selector}' không thuộc kiểu '${Type.name}' như mong muốn. Kiểm tra log ở trên.`);
        }

        DOMQuery._resetRoot();
        return element;
    }

    /**
     * Query tất cả các phần tử DOM phù hợp và trả về một mảng.
     * @template {typeof HTMLElement} T
     * @param {keyof HTMLElementTagNameMap | string} selector - Selector của phần tử, hỗ trợ gợi ý tên thẻ
     * @param {T} [Type=HTMLElement] - Kiểu phần tử mong muốn, mặc định là `HTMLElement`
     * @return {T['prototype'][]} Mảng phần tử được `querySelectorAll` tìm thấy và được ép kiểu
     * @throws {Error} Nếu các phần tử HTML được tìm thấy có kiểu mâu thuẫn với `Type` mong muốn hoặc lỗi do `querySelectorAll` ném ra
     */
    static queryAll(selector, Type = HTMLElement) {
        DOMQuery._initRoot();
        let elements;

        try {
            elements = Array.from(DOMQuery._root.querySelectorAll(selector));
        } catch (error) {
            throw new Error(`DOMQuery error: Lỗi khi thực hiện 'queryAll' với selector '${selector}': ${error.message}`);
        }

        elements.forEach((element) => {
            if (!(element instanceof Type)) {
                console.error(`DOMQuery log debug: Phần tử với selector '${selector}' không thuộc kiểu '${Type.name}':`, element);
                throw new Error(`DOMQuery error: Một hoặc nhiều phần tử với selector '${selector}' không thuộc kiểu '${Type.name}'. Kiểm tra log debug ở trên.`);
            }
        });

        DOMQuery._resetRoot();
        return elements;
    }

    /**
     * @template {keyof HTMLElementTagNameMap} K
     * @param {K} tagName - Tên thẻ mong muốn truy vấn
     * @returns {HTMLElementTagNameMap[K][]} Phần tử được `getElementsByTagName` tìm thấy và được ép kiểu
     * @throws {Error} Nếu lỗi do `getElementsByTagName` ném ra
     */
    static queryAllByTagName(tagName) {
        DOMQuery._initRoot();
        let elements;

        try {
            elements = Array.from(DOMQuery._root.getElementsByTagName(tagName));
        } catch (error) {
            throw new Error(`DOMQuery error: Lỗi khi thực hiện 'queryAllByTagName' với tagName '${tagName}': ${error.message}`);
        }

        DOMQuery._resetRoot();
        return elements;
    }

    /**
     * @template {typeof HTMLElement} T
     * @param {string} className - Tên class mong muốn truy vấn
     * @param {T} [Type=HTMLElement] - Kiểu phần tử mong muốn, mặc định là `HTMLElement`
     * @returns {T['prototype'][]} Mảng phần tử được `getElementsByClassName` tìm thấy và được ép kiểu
     * @throws {Error} Nếu các phần tử HTML được tìm thấy có kiểu mâu thuẫn với `Type` mong muốn hoặc lỗi do `getElementsByClassName` ném ra
     */
    static queryAllByClassName(className, Type = HTMLElement) {
        DOMQuery._initRoot();
        let elements;

        try {
            elements = Array.from(DOMQuery._root.getElementsByClassName(className));
        } catch (error) {
            throw new Error(`DOMQuery error: Lỗi khi thực hiện 'queryAllByClassName' với className '${className}': ${error.message}`);
        }

        elements.forEach((element) => {
            if (!(element instanceof Type)) {
                console.error(`DOMQuery log debug: Phần tử với className '${className}' không thuộc kiểu '${Type.name}':`, element);
                throw new Error(`DOMQuery error: Một hoặc nhiều phần tử với className '${className}' không thuộc kiểu '${Type.name}'. Kiểm tra log debug ở trên.`);
            }
        });

        DOMQuery._resetRoot();
        return elements;
    }
}