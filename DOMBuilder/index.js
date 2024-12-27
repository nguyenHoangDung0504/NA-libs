/**
 * @template {HTMLElement} T
 * @typedef {{
 *   AnchorBuilder: AnchorBuilder,
 *   AudioBuilder: AudioBuilder,
 *   ImageBuilder: ImageBuilder,
 *   VideoBuilder: VideoBuilder,
 *   default: DOMBuilder<T>
 * }[
 *   T extends HTMLAnchorElement ? 'AnchorBuilder' :
 *   T extends HTMLAudioElement ? 'AudioBuilder' :
 *   T extends HTMLImageElement ? 'ImageBuilder' :
 *   T extends HTMLVideoElement ? 'VideoBuilder' :
 *   'default'
 * ]} Builders
 */

function getBuilders() {
    return {
        HTMLAnchorElement: AnchorBuilder,
        HTMLVideoElement: VideoBuilder,
        HTMLAudioElement: AudioBuilder,
        HTMLImageElement: ImageBuilder,
    }
}

/**
 * @template {HTMLElement} T
 */
export default class DOMBuilder {
    /**
     * The target element
     * @protected
     * @type {T}
     */
    _target;

    /**
     * @param {T} element
     */
    constructor(element) {
        this._target = element;
    }

    /**
     * Đặt thuộc tính id
     * @param {string} id 
     */
    id(id) {
        this._target.id = id;
        return this;
    }

    /**
     * Đặt thuộc tính class, có thể truyền vào nhiều tên class
     * @param {...string} classes 
     */
    classes(...classes) {
        classes.forEach(className => this._target.classList.add(className));
        return this;
    }

    /**
     * Thay thế toàn bộ HTML bên trong element
     * @param {string} htmlString 
     */
    setHtml(htmlString) {
        this._target.innerHTML = htmlString;
        return this;
    }

    /**
     * Thêm chuỗi HTML vào element
     * @param {string} htmlString 
     */
    pushHtml(htmlString) {
        this._target.innerHTML += htmlString;
        return this;
    }

    /**
     * Thay thế nội dung text trong element
     * @param {string} textContent 
     */
    setText(textContent) {
        this._target.textContent = textContent;
        return this;
    }

    /**
     * Thêm nội dung text vào element
     * @param {string} textContent 
     */
    pushText(textContent) {
        this._target.textContent += textContent;
        return this;
    }

    /**
     * Đặt các thuộc tính cho element
     * @param {...[key: string, value: string]} keyWithAttributes 
     */
    attributes(...keyWithAttributes) {
        keyWithAttributes.forEach(([key, value]) => this._target.setAttribute(key, value));
        return this;
    }

    /**
     * Đặt style cho element, nếu style nào đó đã tồn tại thì ghi đè
     * @param {CSSStyleDeclaration} style 
     */
    applyStyle(style) {
        for (const [key, value] of Object.entries(style)) {
            this._target.style[key] = value;
        }
        return this;
    }

    /**
     * @template {keyof HTMLElementEventMap} K
     * @param {K} event 
     * @param {(this: T, ev: HTMLElementEventMap[K]) => any} listener 
     * @param {boolean | AddEventListenerOptions | undefined} options 
     */
    on(event, listener, options = undefined) {
        this._target.addEventListener(event, listener, options);
        return this;
    }

    /**
     * 
     * @param {(target: T) => void} callFn 
     */
    callTarget(callFn) {
        callFn(this._target);
    }

    /**
     * Lấy về phần tử HTML sau khi đã build
     * @returns {T}
     */
    export() {
        return this._target;
    }

    /**
     * Factory function để khởi tạo builder
     * @template {HTMLElement} T
     * @param {T} element
     * @returns {Builders<T>}
     */
    static fromElement(element) {
        return new (getBuilders()[element.constructor.name] || DOMBuilder)(element);
    }
}

/**
 * @extends DOMBuilder<HTMLAnchorElement>
 */
class AnchorBuilder extends DOMBuilder {
    /**
     * @param {HTMLAnchorElement} element
     */
    constructor(element) {
        super(element);
    }

    /**
     * Đặt thuộc tính href
     * @param {string} url 
     */
    href(url) {
        this._target.href = url;
        return this;
    }

    /**
     * Đặt thộc tính target
     * @param {string} target 
     */
    target(target) {
        this._target.target = target;
        return this;
    }
}

/**
 * @extends DOMBuilder<HTMLVideoElement>
 */
class VideoBuilder extends DOMBuilder {
    /**
     * @param {HTMLVideoElement} element
     */
    constructor(element) {
        super(element);
    }

    /**
     * Đặt các đường dẫn làm source cho element
     * @param {...string} sources 
     */
    source(...sources) {
        sources.forEach(src => {
            const standardizedSource = standardizedUrl(src);

            if (standardizedSource) {
                const sourceElement = document.createElement("source");
                sourceElement.src = standardizedSource;
                this._target.appendChild(sourceElement);
            } else {
                console.warn(`Invalid URL: "${src}", ignoring.`);
            }
        });

        /**
         * @param {String} url 
         * @returns {String}
         */
        function standardizedUrl(url) {
            try {
                return new URL(url).toString();
            } catch (_) {
                return '';
            }
        }

        return this;
    }

    /**
     * Set the current time of the video
     * @param {number} time
     */
    currentTime(time) {
        this._target.currentTime = time;
        return this;
    }
}

/**
 * @extends DOMBuilder<HTMLAudioElement>
 */
class AudioBuilder extends DOMBuilder {
    /**
     * @param {HTMLAudioElement} element
     */
    constructor(element) {
        super(element);
    }

    /**
     * Đặt các đường dẫn làm source cho element
     * @param {...string} sources 
     */
    source(...sources) {
        sources.forEach(src => {
            const standardizedSource = standardizedUrl(src);

            if (standardizedSource) {
                const sourceElement = document.createElement("source");
                sourceElement.src = standardizedSource;
                this._target.appendChild(sourceElement);
            } else {
                console.warn(`Invalid URL: "${src}", ignoring.`);
            }
        });

        /**
         * @param {String} url 
         * @returns {String}
         */
        function standardizedUrl(url) {
            try {
                return new URL(url).toString();
            } catch (_) {
                return '';
            }
        }

        return this;
    }

    /**
     * Set the current time of the video
     * @param {number} time
     */
    currentTime(time) {
        this._target.currentTime = time;
        return this;
    }
}

/**
 * @extends DOMBuilder<HTMLImageElement>
 */
class ImageBuilder extends DOMBuilder {
    /**
     * @param {HTMLImageElement} element
     */
    constructor(element) {
        super(element);
    }

    /**
     * Đặt thuộc tính src cho element
     * @param {string} url
     */
    src(url) {
        this._target.src = url;
        return this;
    }

    /**
     * Đặt thuộc tính alt cho element
     * @param {string} alt
     */
    alt(alt) {
        this._target.alt = alt;
        return this;
    }
}