export default class DecoratorSupporter {
    /**
     * @template T
     * @template {keyof InstanceType<TargetClass>} K
     * @param {new (...args: any[]) => T} TargetClass 
     * @param {K[] | '*'} targetMethods 
     * @param {(...args: any) => ReturnType<InstanceType<TargetClass>[K]>} decorator 
     */
    static applyDecorator(TargetClass, targetMethods, decorator) {
        
    }
}