import { Component, Input, Output, EventEmitter, OnInit, ViewChild, OnChanges } from '@angular/core';
import { FwSearchHistoryService } from './fw-search-history.service';
import { Pageable, ArrayPage } from '../../../util/pageable';
import * as _ from 'lodash';
import { MessageService } from 'src/app/shared/communication/message.service';
import { MatTableDataSource, MatCheckbox, MatPaginator } from '@angular/material';
import { Subject } from 'rxjs';
import { FwController } from '../fw-controller';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'fw-search-history',
  templateUrl: './fw-search-history.component.html',
  styleUrls: ['./fw-search-history.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class FwSearchHistory implements OnInit, FwController {

  static DEFAULT_OPTIONS = {
    title: 'SearchHistory',
    searchOnLoad: true
  };

  subject: Subject<any> = new Subject();

  @Input()
  options: any = FwSearchHistory.DEFAULT_OPTIONS;

  @Input()
  filtersFn: Function;

  @Input()
  path: string;

  @Input()
  service: FwSearchHistoryService;

  @Input()
  pageSize: number = 10;

  @Input()
  enableSelection: boolean = false;

  @Input()
  selectionCondition: (any) => boolean;

  @Input()
  hasExtensionPanel: boolean = true;

  @Input()
  hasPaginator: boolean = true;

  @Input()
  idCol: string = 'id';

  @Input()
  cols: any[] = [
    { title: 'Id', prop: 'id' },
    { title: 'Nome', prop: 'name' }
  ];

  @Input()
  innerCols: any[];

  @Input()
  innerActions: any[];

  @Input()
  addFields: string[];

  @Input()
  actions: any[] = [
    {
      title: 'Ações',
      subActions: [
        { title: 'Editar', action: 'edit' },
        { title: 'Remover', action: 'remove' }
      ]
    }
  ];

  @Input()
  formActions: any[];

  @Input()
  innerListSearch: any;

  @Input()
  expand: boolean = false;

  @Output()
  onClear = new EventEmitter<any>();

  @Output()
  onSearch = new EventEmitter<any>();

  @Output()
  onSelect = new EventEmitter<any>();

  @Output()
  onPage = new EventEmitter<any>();

  @Output()
  onAction = new EventEmitter<any>();

  @Output()
  onCheckUncheckAll = new EventEmitter<any>();

  @Output()
  onCreateInnerList = new EventEmitter<any>();

  @ViewChild('selectorAll') selectorAll: MatCheckbox;
  @ViewChild('paginator') paginator: MatPaginator;
  
  filters: any = {};
  pageable: Pageable;
  page: ArrayPage<any>;

  hideSpinnerSearch: boolean = true;

  displayedColumns: string[] = [];
  innerDisplayedColumns: string[] = [];

  dataSource = new MatTableDataSource<any>();

  invoiceHistory: any[] = [];
  invoiceNoteHistory: any[] = [];
  noteBillets: any[] = [];

  debitNoteHistory: any;

  selectionList: any[] = [];

  expandedElement: any | null;

  isInvoiceOnly: boolean;

  constructor(
    private searchHistoryService: FwSearchHistoryService,
    private messageService: MessageService,
    private router: Router) {
  }

  ngOnInit(): void {
    if (this.path == null && this.service == null) {
      throw new Error('Define a path or service.');
    }
    if (this.cols == null || this.cols.length == 0) {
      throw new Error('Columns not defined.');
    }

    this.options = _.merge({}, FwSearchHistory.DEFAULT_OPTIONS, this.options);

    this.makeColumns();

    this.pageable = new Pageable(0, this.pageSize);

    if (this.props('searchOnLoad')) {
      this.search();
    }

  }

  private makeColumns() {
    if (this.enableSelection) {
      this.displayedColumns = ['selection'];
    }

    this.displayedColumns = this.displayedColumns.concat(
      _(this.cols)
        .map(col => col.prop)
        .union(
          _(this.getActions()).map(col => col.action).value()
        ).value()
    );

    this.innerDisplayedColumns = [];
    if (this.innerCols) {
      this.innerDisplayedColumns = this.innerDisplayedColumns.concat(
        _(this.innerCols)
          .map(col => col.prop)
          .union(
            _(this.getInnerActions()).map(col => col.action).value()
          ).value()
      );
    }

  }

  checkUncheckAll(event: any) {
    if (!this.enableSelection) {
      return;
    }

    this.dataSource.data.forEach(elem => elem.checked = event.checked);

    this.dataSource.data.forEach(element => {
      this.selectionList = _.remove(this.selectionList, value => value.id !== element.id);
    });

    if (event.checked) {
      this.dataSource.data.forEach(element => this.selectionList.push(element));
    }

    this.onCheckUncheckAll.emit({ current: event.checked, data: this.dataSource.data });
  }

  checkSelectionCondition(element: any) {
    return !this.selectionCondition || this.selectionCondition(element);
  }

  startSelecting() {
    this.enableSelection = true;
    this.makeColumns();
  }

  selectItem(element: any, event: any) {
    element.checked = event.checked;
    if (!element.checked) {
      this.selectionList = _.remove(this.selectionList, value => value.id !== element.id);
    } else {
      this.selectionList.push(element);
    }
    this.onSelect.emit(element);
  }

  props(name: string): any {
    if (!this.options || !this.options[name]) {
      return null;
    }
    return this.options[name];
  }

  private updateDatasource(page: ArrayPage<any>, resetPage:boolean){
    if(resetPage && this.paginator) this.paginator.pageIndex = 0
    this.dataSource.data = page.content;
    if (this.selectorAll) {
      this.selectorAll.checked = false;
    }
    if (this.selectionList.length) {
      let newSelectionListMapeada = this.selectionList.map(item => item.id);
      this.dataSource.data.forEach(item => {
        let variavel = undefined;
        if (newSelectionListMapeada.includes(item.id)) {
          item.checked = true;
          variavel = newSelectionListMapeada.indexOf(item.id);
        }
        this.selectionList[variavel] = item;
      });
      if (this.dataSource.data.filter(item => item.checked).length == 10) {
        this.selectorAll.checked = true;
      }
    }
  }

  search(resetPage = true) {
    this.onSearch.emit();

    if (this.filters.continueSearch != false) {
      const params = _.clone(this.filters);

      if (this.filtersFn) {
        this.filtersFn(params);
      }

      params.fields = _(this.cols)
        .map(col => col.prop)
        .union([this.idCol])
        .union(this.addFields || [])
        .join(',');

      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] == null) {
          delete params[key];
        } else if (typeof params[key] == 'object' && params[key]['_mapAs']) {

          const mapAs = <string>params[key]['_mapAs'];
          if (mapAs.length < 1) {
            throw new Error('Property mapAs empty!');
          }
          const cc = mapAs.length === 1 ? mapAs.toUpperCase() : mapAs.substring(0, 1).toUpperCase() + mapAs.substring(1);
          params[key + cc] = params[key][mapAs];
          delete params[key];
        }

      });

      if (resetPage) {
        this.pageable.page = 0;
        this.selectionList = [];
      }

      this.hideSpinnerSearch = false;
      this.searchHistoryService.search(this.path, params, this.pageable)
        .subscribe(
          (page) => {
            this.page = page;
            this.updateDatasource(page, resetPage);
            this.subject.next({ name: 'search' });
          },
          (error) => {
            this.messageService.dealWithError(error);
          },
          () => {
            this.hideSpinnerSearch = true;
          }
        );
    }
  }

  clear() {
    let previousFilters = _.clone(this.filters);
    this.subject.next({ name: 'clear' });
    Object.keys(this.filters).forEach(key => delete this.filters[key]);
    this.onClear.emit({ previousFilters: previousFilters });
  }

  expandRow(line: any, event: any) {
    this.invoiceNoteHistory = null;
    this.debitNoteHistory = null;
    this.noteBillets = null;
    this.invoiceHistory = null;
    this.isInvoiceOnly = false;
    const _this = this;
    this.onCreateInnerList.emit({ line });
    if (event.path[0].firstChild.data != 'more_horiz') {
      if (this.expandedElement === line) {
        this.expandedElement = null;
        this.invoiceNoteHistory = null;
        this.debitNoteHistory = null;
        this.invoiceHistory = null;
        this.isInvoiceOnly = false;
      } else {
        if (this.service) {
          this.expandedElement = line;
          if (this.expandedElement.noteType === "NF") {
            let noteId = line.innerListFilter.createdInvoiceNoteIdList.length ? line.innerListFilter.createdInvoiceNoteIdList : line.lastCanceledNote;
            this.service.getInvoiceNoteInfo('billing-history/invoice-note-info/', noteId, undefined)
                .subscribe(
                    (page) => {
                        page.invoiceNoteHistoryDTO.forEach(note => note.canceledInvoiceNotes = line.canceledInvoiceNotes ? "Sim - " + line.canceledInvoiceNotes : "Não");
                        _this.invoiceNoteHistory = page.invoiceNoteHistoryDTO;
                        _this.noteBillets = page.billetHistoryDTO;
                        _this.invoiceHistory = page.invoiceHistoryDTO;
                    },
                    (error) => {
                        _this.messageService.dealWithError(error);
                    }
                );
          } else if (this.expandedElement.noteType === "ND") {
            let noteId = line.innerListFilter.debitNoteId != null ? line.innerListFilter.debitNoteId : line.lastCanceledNote;
            this.service.getInvoiceNoteInfo('billing-history/debit-note-info/', noteId, undefined)
                .subscribe(
                    (page) => {
                      page.debitNoteHistoryDTO.canceledDebitNotes = line.canceledDebitNotes ? "Sim - " + line.canceledDebitNotes : "Não"
                      _this.debitNoteHistory = page.debitNoteHistoryDTO;
                      _this.noteBillets = page.billetHistoryDTO;
                    },
                    (error) => {
                        _this.messageService.dealWithError(error);
                    }
                );
          } else if (this.expandedElement.noteType === "MC") {
            let invoiceId = line.innerListFilter.invoiceId != null ? line.innerListFilter.invoiceId : line.lastCanceledNote;
            this.service.getInvoiceNoteInfo('billing-history/invoice-info/', invoiceId, undefined)
                .subscribe(
                    (page) => {
                      _this.invoiceHistory = page;
                      _this.isInvoiceOnly = true;
                    },
                    (error) => {
                        _this.messageService.dealWithError(error);
                    }
                );
          }
        }
      }
    }
  }

  onPageEvent(event: any) {
    this.pageable.page = event.pageIndex;
    this.search(false);
    this.onPage.emit(event);
  }


  execute(action: any, line: any, index: number) {

    const id = line[this.idCol];

    if (action.command) {
      if (action.command.name === 'routeWithId' && !!action.command.params && !!action.command.params.route) {
        this.router.navigate([action.command.params.route + id]);
      }

      if (action.command.name === 'searchAndDelete') {
        this.searchHistoryService.removeAfterSearch(this.path, id)
          .subscribe(
            () => this.search()
          );
      }

    }


    this.onAction.emit({ action: action, id: id, index: index, line: line });

  }

  getAvailableCols() {
    return _(this.cols).filter(col => !col.customTemplate).value();
  }

  getInnerAvailableCols() {
    return this.innerCols;
  }

  getActions() {
    return _(this.actions).filter(act => !act.isSubAction).value();
  }

  getInnerActions() {
    return _(this.innerActions).filter(act => !!act.isSubAction).value();
  }

  getSubActions(action: any, line: any) {
    if (action.subActions.length > 0) {
      return _(action.subActions)
        .filter(sub => !sub.condition || (typeof sub.condition == 'function' && sub.condition(line)))
        .value();
    } else {
      return _(action.innerSubActions)
        .filter(sub => !sub.condition || (typeof sub.condition == 'function' && sub.condition(line)))
        .value();
    }
  }


  renderColTitle(col: any, type: string = 'col'): string {
    if (!col) {
      throw new Error(`Column ${type} not defined : ${col}`);
    }
    if (col.enableHint) {
      return '';
    }
    if (type === 'col') {
      return col.title || col.prop || '?';
    } else {
      return col.title;
    }
  }

  renderColTitleClass(col: any, type: string = 'col') {
    if (!col) {
      throw new Error(`Column ${type} not defined : ${col}`);
    }
    return col.ngClass || '';
  }

  renderColValue(col: any, line: any, index: number, type: string = 'col') {
    if (!col) {
      throw new Error(`Column ${type} not defined : ${col}`);
    }
    if (!line) {
      return null;
    }

    if (col.enableHint) {
      return null;
    } else if (type === 'col') {

      let val = !!col.prop ? _.get(line, col.prop) : line.toString();
      if (!!col.converter && col.converter instanceof Function) {
        val = col.converter(val, { line: line, index: index });
      }
      return val;
    } else if (col.actionByValue === true) {
      return this.renderColValue(col, line, index, 'col');
    } else if (!!col.icon && col.icon.iconOnly === true) {
      return null;
    } else {
      return col.title;
    }
  }

  renderColValueClass(col: any, type: string = 'col'): any {
    if (!col) {
      throw new Error(`Column ${type} not defined : ${col}`);
    }
    return col.ngClass || '';
  }

  renderActionIconClass(act: any): any {
    if (!act) {
      throw new Error(`Action not defined : ${act}`);
    }
    if (!act.icon) {
      return null;
    }
    return act.icon.ngClass || '';
  }

  hasIcon(act: any): boolean {
    return !!act && !!act.icon;
  }

  renderIconName(act: any) {
    if (!act) {
      throw new Error(`Action not defined : ${act}`);
    }
    if (!act.icon) {
      return null;
    }
    return act.icon.name;
  }

  renderColHint(col: any, element: any) {
    return col.enableHint && col['hintCondition'](element);
  }

  renderColHintValue(col: any, element: any) {
    if (this.renderColHint(col, element)) {
      return element[col.prop];
    }

  }

  isDiabled(act: any, line: any, index: number): boolean {
    return !!act && (act.disabled === true || (!!act.checkDisabled && act.checkDisabled(act, line, index) === true));
  }

  clearSelectionList(): void {
    this.selectionList = [];
    this.dataSource._updateChangeSubscription();
  }

  noteNumbersFromBillet(col: any, element: any): string {
    return element.noteNumber;
  }
}



