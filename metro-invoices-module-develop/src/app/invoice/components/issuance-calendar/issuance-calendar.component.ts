import { DatePipe, formatCurrency } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { CalendarEvent, CalendarMonthViewBeforeRenderEvent, CalendarView } from 'angular-calendar';
import { ViewPeriod } from 'calendar-utils';
import { isSameMonth } from 'date-fns';
import moment from 'moment-timezone';
import { RRule } from 'rrule';
import { Subject } from 'rxjs';
import { MessageService } from 'src/app/shared/communication/message.service';
import { CustomerService } from '../../services/customer.service';
import { IssuanceDetails } from './issuance-details/issuance-details.component';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { userRoles } from 'src/app/shared/util/user-roles';

const LOCALE = 'pt-BR';
@Component({
  selector: 'app-issuance-component', 
  templateUrl: './issuance-calendar.component.html',
  styleUrls: ['./issuance-calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IssuanceCalendar   {
  
  requiredRolesToView: string = userRoles.inIssuanceCalendarView;

  view: CalendarView = CalendarView.Month;
  viewDate: Date = new Date();

  refresh: Subject<any> = new Subject();
  
  issuanceNote: string = 'INVOICE_CALC_NOTE';

  viewPeriod: ViewPeriod;

  calendarEvents: CalendarEvent[] = [];

  dialogRef: MatDialogRef<any>;

  colunasNotaFiscal: any[] = [{title:'Codigo do Cliente', prop: 'sapCode', filter: true},
                              {title:'Nome', prop: 'name', filter: true}]
  colunasNotaDebito: any[] = [{title:'Codigo do Cliente', prop: 'sapCode', filter: true},
                              {title:'Nome', prop: 'name', filter: true},
                              {title:'Nota', prop: 'typeNote'},
                              {title:'Valor', prop: 'valor', converter : currencyConv }]
  colunasMemoriaCal: any[] = [{title:'Codigo do Cliente', prop: 'sapCode', filter: true},
                              {title:'Nome', prop: 'name', filter: true}]
  constructor(
    private dialog: MatDialog,
    private customerService: CustomerService,
    private messageService: MessageService,
    private authService: AuthService
    ) {}

  ngOnInit() {
    this.authService.checkAuthorization(this.requiredRolesToView, (comp) => true, undefined);
  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate) && events.length) {
      this.viewDate = date;
      this.showIssuanceDetails(events);
    }
  }
  
  updateCalendarEvents(viewRender: CalendarMonthViewBeforeRenderEvent): void {
    if (!this.viewPeriod || !moment(this.viewPeriod.start).isSame(viewRender.period.start) ||
      !moment(this.viewPeriod.end).isSame(viewRender.period.end)) {
      this.viewPeriod = viewRender.period;
      this.findIssuances();
    }
  }

  findIssuances() {
    const _this = this;
    this.customerService.findNoteIssuance(this.issuanceNote, this.viewDate.getMonth(), this.viewDate.getFullYear())
    .subscribe(
      (response)=> {
        _this.calendarEvents = [];
        response.forEach(issuanceNote => {
          const rule: RRule = new RRule({
            ...{
              freq: RRule.MONTHLY,
              bymonthday: issuanceNote.issuanceDate
            },
            dtstart: moment(_this.viewPeriod.start)
              .startOf('day')
              .toDate(),
            until: moment(_this.viewPeriod.end)
              .endOf('day')
              .toDate()
          });
  
          rule.all()
            .map(date=>createCalendarEvent(date, issuanceNote))
            .forEach(event => _this.calendarEvents.push(event));
        }); 
        _this.refresh.next();
      },
      (error)=> {
        this.messageService.dealWithError(error);
      }
    );
  }

  showIssuanceDetails(events: any[]) {
    if (!!this.dialogRef) {
      return;
    }
    this.dialogRef = this.dialog.open(IssuanceDetails, { data: { list: createListFromEvents(events), 
      cols: this.getColumnsCalendar(this.issuanceNote), title: 'Grupos de Faturamento' }, width:'600px' });
  
    this.dialogRef.afterClosed().subscribe(result => {
      this.dialogRef = null;
    })
  }
  
  getColumnsCalendar(issuanceNote: string): any[] {
    let columnscalendar: any[];
    switch(issuanceNote) {
      case 'INVOICE_NOTE':
        columnscalendar = this.colunasNotaFiscal;
        break;
      case 'DEBIT_NOTE':
        columnscalendar = this.colunasNotaDebito;
        break;
      case 'INVOICE_CALC_NOTE':
        columnscalendar = this.colunasMemoriaCal;
        break;
    }
    return columnscalendar;
  }


  monthFormat(viewDate) {
    let value = new DatePipe('pt').transform(viewDate, 'MMMM \'de\' yyyy', 'pt');
    return value.charAt(0).toLocaleUpperCase() + value.slice(1);
  }
}

function createCalendarEvent(date: Date, issuanceNote: any) {
  return {
    title: issuanceNote.customer,
    typeNote: issuanceNote.typeNote,
    valor:issuanceNote.monthlyAmout,
    start: moment(date).toDate(),
    sapCode: issuanceNote.sapCode
   
  }
}

function createListFromEvents(events: any[]) {
  return events.map(event=>{ return {name: event.title, typeNote: event.typeNote, valor: event.valor, sapCode: event.sapCode }})
 
}
function currencyConv(value: any) {
  return formatCurrency(value, LOCALE, 'R$');
}
