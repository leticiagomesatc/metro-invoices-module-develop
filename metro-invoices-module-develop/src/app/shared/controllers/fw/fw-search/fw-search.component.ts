import { Component, Input, Output, EventEmitter, OnInit, ViewChild, OnChanges } from '@angular/core';
import { FwSearchService } from './fw-search.service';
import { Pageable, ArrayPage } from '../../../util/pageable';
import * as _ from 'lodash';
import { MessageService } from 'src/app/shared/communication/message.service';
import { MatTableDataSource, MatCheckbox, MatPaginator, Sort } from '@angular/material';
import { Subject } from 'rxjs';
import { FwController } from '../fw-controller';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import * as moment from 'moment';

@Component({
  selector: 'fw-search',
  templateUrl: './fw-search.component.html',
  styleUrls: ['./fw-search.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class FwSearch implements OnInit, FwController {

  static DEFAULT_OPTIONS = {
    title: 'Search',
    searchOnLoad: true
  };

  subject: Subject<any> = new Subject();

  @Input()
  options: any = FwSearch.DEFAULT_OPTIONS;

  @Input()
  filtersFn: Function;

  @Input()
  path: string;

  @Input()
  service: FwSearchService;

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
  hasOrding: boolean = false;

  @Input()
  idCol: string = 'id';

  @Input()
  typetooltip: string;
  
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
  
  sort: Sort;
  pageable: Pageable;
  page: ArrayPage<any>;

  hideSpinnerSearch: boolean = true;
  hideSpinnerMenu: boolean = true;

  displayedColumns: string[] = [];
  innerDisplayedColumns: string[] = [];

  dataSource = new MatTableDataSource<any>();
  billetsDataSource = new MatTableDataSource<any>();

  selectionList: any[] = [];

  expandedElement: any | null;

  constructor(
    private searchService: FwSearchService,
    private messageService: MessageService,
    private authService: AuthService,
    private router: Router) {
  }


  ngOnInit(): void {
    if (this.path == null && this.service == null) {
      throw new Error('Define a path or service.');
    }
    if (this.cols == null || this.cols.length == 0) {
      throw new Error('Columns not defined.');
    }

    this.options = _.merge({}, FwSearch.DEFAULT_OPTIONS, this.options);

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

  typeTooltip() {
    if(this.typetooltip === 'help'){
      return true;
    }
    return false;
  }

  startSelecting() {
    this.enableSelection = true;
    this.makeColumns();
  }

  selectItem(element: any, event: any) {
    element.checked = event.checked;
    if (!element.checked) {
      this.selectionList = _.remove(this.selectionList, value => value.id !== element.id);
      this.selectorAll.checked = false;
    } else {
      this.selectionList.push(element);
      if (this.dataSource.data.length === this.selectionList.length) {
        this.selectorAll.checked = true;
      }
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

      const regex = new RegExp(/(?:[01]\d|2[0123]):(?:[012345]\d):(?:[012345]\d)/); //Regex para verificar se é data.
      const regexDefault = new RegExp('GMT-0300');// Regex para verificar se está no formato pt-br.
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
        } else if (typeof params[key] == 'object' && regex.test(params[key].toString()) && !regexDefault.test(params[key].toString()) ){
          params[key] = params[key].toString().substring(0, 24);//REMOVE O FINAL DA DATA RECEBIDA 'GMT+0000', E O QUE CAUSA ERRO NA REQUISICAO.
        }
      });

      if (resetPage) {
        this.pageable.page = 0;
        this.selectionList = [];
      }

      this.hideSpinnerSearch = false;
      this.searchService.search(this.path, params, this.pageable, this.sort)
        .subscribe(
          (page) => {
            this.page = page;
            this.updateDatasource(page, resetPage);
            this.subject.next({ name: 'search' });
          },
          (error) => {
            this.messageService.dealWithError(error);
            this.hideSpinnerSearch = true;
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
    this.onCreateInnerList.emit({ line });
    if (event.path[0].firstChild.data != 'more_horiz') {
      if (this.expandedElement === line) {
        this.expandedElement = null;
      } else {
        if (this.service) {
          this.expandedElement = line;
          this.billetsDataSource.data = [];
          this.service.search(undefined, line.innerListFilter, undefined, this.sort)
            .subscribe(
              (page) => {
                this.billetsDataSource.data = page.content;
                this.billetsDataSource.data.forEach(innerLine => innerLine.outerLine = line);
              },
              (error) => {
                this.messageService.dealWithError(error);
              }
            );
        }
      }
    }
  }

  onPageEvent(event: any) {
    console.log(event);
    this.pageable.page = event.pageIndex;
    this.pageable.size = event.pageSize;
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
        this.searchService.removeAfterSearch(this.path, id)
          .subscribe(
            () => this.search(),
            (error) => this.messageService.dealWithError(error)
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
    return _(this.actions).filter(act => !act.isSubAction).forEach(act => act.subActions = act.subActions.filter(sub => !sub.role || this.authService.hasRole(sub.role)))
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
    if (col.enableHint && col.hintContent == undefined) {
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

    if (col.enableHint && col.hintContent == undefined) {
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

  // renderIconNameHoriz(act: any, line: any) {
  //   const list = act.subActions.filter(actLine => (typeof actLine.condition == 'function' && actLine.condition(line)));
  //   if (list.length > 0) {
  //     return 'more_horiz';
  //   } else {
  //     return '';
  //   }
  // }

  renderColHint(col: any, element: any, checkHintContent: boolean) {
    return col.enableHint && col['hintCondition'](element) && (checkHintContent ? col.hintContent == undefined : true);
  }

  renderColHintValue(col: any, element: any) {
    if (this.renderColHint(col, element, false)) {
      if(col.hintContent) {
        return col.hintContent;
      }
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

  sortData(sort: Sort) {
    this.sort = { active: sort.active, direction: sort.direction}
    if(sort.active != 'buildHelp'){
      if (!sort.active || sort.direction === '') {
        return this.search();
     }
     
     this.onSearch.emit();
     this.searchService.search(this.path, this.filters, this.pageable, this.sort)
       .subscribe(
         (page) => {
           this.page = page;
           this.updateDatasource(page, true);
           this.subject.next({ name: 'search' });
         },
         (error) => {
           this.messageService.dealWithError(error);
           this.hideSpinnerSearch = true;
         },
         () => {
           this.hideSpinnerSearch = true;
         }
       );     
    }
  }
}