export enum Severity {
    INFO,
    WARN,
    ERROR
}

export class SevertyDesc {
    public static of(sev: Severity) {
        switch(sev) {
            case Severity.INFO: return 'Informação';
            case Severity.WARN: return 'Aviso';
            case Severity.ERROR: return 'Erro';
            default: throw new Error('');

        }
    }
}