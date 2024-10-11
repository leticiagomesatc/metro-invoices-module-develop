import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
 
import { HttpClientModule } from '@angular/common/http'; 
import {MatButtonModule, MatCheckboxModule, MatSidenavModule, MatToolbarModule, MatCard, MatCardModule, MatPaginator, MatPaginatorModule, MatMenu, MatMenuModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatExpansionPanel, MatExpansionModule, MatTableModule, MatIconModule, MatOptionModule, MatAutocomplete, MatAutocompleteModule, MatError, MatTooltipModule, MatProgressSpinnerModule, MatSort, MatSortModule} from '@angular/material';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FwAutocompleteComponent } from './fw-autocomplete/fw-autocomplete.component';
import { FwSearch } from './fw-search/fw-search.component';
import { FwEdit } from './fw-edit/fw-edit.component';
import { FwSearchService } from './fw-search/fw-search.service';
import { FwEditService } from './fw-edit/fw-edit.service';
import { CdkColumnDef } from '@angular/cdk/table';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {FwValidate} from './fw-validate/fw-validate.component';
import {FwValidateService} from './fw-validate/fw-validate.service';
import { FwSearchHistory } from './fw-search-history/fw-search-history.component';
import { FwSearchHistoryService } from './fw-search-history/fw-search-history.service';


@NgModule({
  declarations: [ 
    FwEdit,
    FwSearch,
    FwAutocompleteComponent,
    FwValidate,
    FwSearchHistory,
  ],
  entryComponents: [
    FwEdit,
    FwSearch,
    FwAutocompleteComponent,
    FwSearchHistory,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatCardModule,
    MatPaginatorModule,
    MatSidenavModule,
    MatMenuModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatExpansionModule,
    MatTableModule,
    MatIconModule,
    MatSortModule,
    MatOptionModule,
    MatAutocompleteModule,
    MatTooltipModule,
    
    MatFormFieldModule,
    MatDatepickerModule,
    HttpClientModule,
    FlexLayoutModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    
  ],
  providers: [
    HttpClientModule,
    FwSearchService,
    FwEditService,
    FwValidateService,
    MatDatepickerModule,
    CdkColumnDef,
    FwSearchHistoryService,
  ],
  exports: [
    FwEdit,
    FwSearch,
    FwAutocompleteComponent,
    FwValidate,
    FwSearchHistory,
  ],
  schemas:[
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class FwModule { }

