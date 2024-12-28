export default class DecoratorSupporter {
    /**
     * @template T
     * @template {keyof InstanceType<TargetClass>} K
     * @param {new (...args: any[]) => T} TargetClass 
     * @param {K[] | '*'} targetMethods 
     * @param {(...args: any) => ReturnType<InstanceType<TargetClass>[K]>} decorator 
     */
    static applyDecorator(TargetClass, targetMethods, decorator) {
        if (typeof decorator !== 'function') {
            throw new TypeError()
        }

        /**
         * Danh sách tên các method được áp dụng decorator
         */
        const methodNameList =
            targetMethods === 'ALL_METHOD'
                ? Object.getOwnPropertyNames(Class.prototype).filter((name) => typeof Class.prototype[name] === 'function')
                : targetMethods;
    }
}