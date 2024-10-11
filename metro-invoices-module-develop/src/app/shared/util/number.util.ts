export class NumberUtil {

    public static isNumber(value: string | number): boolean {
        return ((value != null) && !isNaN(Number(value.toString())));
    }

    public static safeConvertNumber(value: string | number): number {
        if (value == null) {
            return null;
        } 
        const num = Number(value.toString());
        if(!isNaN(num)) {
            return num;
        } else {
            return null;
        }
    }
}