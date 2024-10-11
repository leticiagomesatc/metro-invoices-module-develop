import * as moment from 'moment';

export class StringUtil {
    public static Empty: string = "";

    public static isNullOrWhiteSpace(value: string): boolean {
        try {
            if (value == null || value == 'undefined')
                return false;

            return value.replace(/\s/g, '').length < 1;
        }
        catch (e) {
            return false;
        }
    }
    
    public static format(value: string, ...args): string {
        try {
            return value.replace(/{(\d+(:.*)?)}/g, function (match, i) {
                var s = match.split(':');
                if (s.length > 1) {
                    i = i[0];
                    match = s[1].replace('}', '');
                }

                var arg = StringUtil.formatPattern(match, args[i]);
                return typeof arg != 'undefined' && arg != null ? arg : StringUtil.Empty;
            });
        }
        catch (e) {
            return StringUtil.Empty;
        }
    }


    private static formatPattern(match, arg): string {
        switch (match) {
            case 'L':
                arg = arg.toLowerCase();
                break;
            case 'U':
                arg = arg.toUpperCase();
                break;
            default:
                break;
        }

        return arg;
    }

    public static retroactiveDaysIn(object: Date) {
        if (!object || moment(object).isAfter(moment())) {
        return '-';
        }
        return moment().hours(0).diff(moment(object), 'days') + ' dias';
    }
}