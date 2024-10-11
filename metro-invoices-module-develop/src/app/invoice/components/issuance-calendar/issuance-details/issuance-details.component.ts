import { Component, Inject, ChangeDetectorRef, Input, ViewChild } from '@angular/core';

import { FormGroup, FormBuilder, Validators, ValidatorFn, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatTableDataSource, MatPaginator } from '@angular/material';
import { FwValidateService } from 'src/app/shared/controllers/fw/fw-validate/fw-validate.service';
import { MessageService } from 'src/app/shared/communication/message.service';
import * as _ from 'lodash';

@Component({
    selector: 'app-issuance-details',
    templateUrl: 'issuance-details.component.html',
    styleUrls : ['./issuance-details.component.scss']
})
export class IssuanceDetails {

    list = new MatTableDataSource<any>();
    listSize:number;
    completeList: any[];
    filteredList: any[];
    displayedColumns: string[] = [];

    cols :any[] = [];

    @ViewChild('paginator') paginator: MatPaginator;

    constructor(
        public validate : FwValidateService,
        private formBuilder: FormBuilder,
        private messageService : MessageService,
        private dialogRef: MatDialogRef<IssuanceDetails>,
        @Inject(MAT_DIALOG_DATA) public data: any) { }

    filterName: string;
    filterCode: string;

    ngOnInit() {
        this.init()
        this.updateTable({pageIndex: 0, pageSize:5}, this.filteredList);
    }

    init() {
        this.completeList = this.data.list
        this.filteredList = this.completeList.slice()
        this.cols = this.data.cols
        this.listSize = this.data.list.length
        this.displayedColumns = this.displayedColumns.concat(_(this.cols).map(col=>col.prop).value());
    }

    close(): void {
        this.dialogRef.close();
    }

    renderColValue(col : any, line : any, index:number, type : string = 'col') {
        if (!col) {
            throw new Error(`Column ${type} not defined : ${col}`);
        }
        if (!line) {
            return null;
        }

        let val = !!col.prop ? _.get(line,col.prop) : line.toString();
        if (!!col.converter && col.converter instanceof Function) {
            val = col.converter(val, {line : line, index : index});
        }
        return val;
    }

    renderColTitle(col :any , type : string = 'col') : string {
        if (!col) {
            throw new Error(`Column ${type} not defined : ${col}`);
        }
        if (type === 'col') {
            return col.title || col.prop || '?';
        } else {
            return col.title;
        }
    }

    getAvailableCols() {
        return this.cols;
    }
    
    onPageEvent(event : any) {
        this.updateTable(event, this.filteredList)
    }

    updateTable(event, completeList) {
        this.list.data = []
        this.listSize = completeList.length
        let begin = event.pageIndex*event.pageSize;
        let end = begin + event.pageSize;
        completeList.slice(begin, end).forEach(item=>this.list.data.push(item));
        this.list._updateChangeSubscription()
    }

    filterList() {
        this.paginator.firstPage();
        if((this.filterName == undefined || this.filterName == '') && (this.filterCode == undefined || this.filterCode == '')){
            this.filteredList = this.completeList;
        }else if((this.filterName != undefined && this.filterName != '') && (this.filterCode != undefined && this.filterCode != '')){
            this.filteredList = this.completeList.filter(item => item['sapCode'] != null)
            this.filteredList = this.filteredList.filter(item => item['name'].toLowerCase().includes(this.filterName.toLowerCase()))
            this.filteredList = this.filteredList.filter(item => item['sapCode'].includes(this.filterCode))
        }else if((this.filterName != undefined && this.filterName != '') && (this.filterCode == undefined || this.filterCode == '')){
            this.filteredList = this.completeList.filter(item => item['name'].toLowerCase().includes(this.filterName.toLowerCase()))
        }else{
            this.filteredList = this.completeList.filter(item => item['sapCode'] != null)
            this.filteredList = this.filteredList.filter(item => item['sapCode'].includes(this.filterCode))
        }
        this.updateTable(
            {pageIndex: 0, pageSize:5}, 
            this.filteredList
        )
    }
    
    renderValueColFilter(item: any): string {
        return item[this.cols.find(item=>item.filter).prop]
    }

    renderColFilter() {
        return this.cols.find(item=>item.filter).title
    }

}
