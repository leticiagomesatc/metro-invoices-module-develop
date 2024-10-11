import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReportService } from 'src/app/invoice/services/report.service';
import { MessageService } from 'src/app/shared/communication/message.service';
import { FwValidateService } from 'src/app/shared/controllers/fw/fw-validate/fw-validate.service';
import { AuthService } from 'src/app/shared/security/auth/auth.service';
import { userRoles } from 'src/app/shared/util/user-roles';

@Component({
  selector: 'app-base-os',
  templateUrl: './base-os.component.html',
  styleUrls: ['./base-os.component.scss']
})
export class BaseOsComponent implements OnInit{

  osSimplificada: Boolean = false;

  form : FormGroup;
  requiredRolesToView: string = userRoles.exportReport;
  statuses: any[] = [
    {key: '0', value:'Ativado'},
    {key: '1', value:'Desativado'},
    {key: '2', value:'Mudança de Endereço'},
    {key: '3', value:'Mudança Interna'},
    {key: '4', value:'Upgrade'},
    {key: '5', value:'Alteração Contratual'},
    {key: '6', value:'Downgrade'},
    {key: '7', value:'Cancelamento - Não Cobrar Ativação'},
    {key: '8', value:'Mudança Ponta A'},
    {key: '9', value:'Backlog'},
    {key: '10', value:'Mudança Canalizado'},
    {key: '11', value:'Cancelado com Multa'},
    {key: '12', value:'Em Desativação'},
    {key: '13', value:'Alteração OS'}
  ];


  constructor(private reportService: ReportService,
    public validate: FwValidateService,
    public authService: AuthService, public messageService: MessageService, private builder: FormBuilder
  ) { }

  @ViewChild('search') search: any;

  ngOnInit() {
    this.authService.checkAuthorization(this.requiredRolesToView,  this.initComponent, this);
  }


  resetMin(control:string) {
    const firstFormControl = `first${control}Date`
    const lastFormControl = `last${control}Date`
    const minField = `minLast${control}`

    this[minField] = this.form.controls[firstFormControl].value
    if(this.form.controls[lastFormControl].value <= this[minField]) this.form.controls[lastFormControl].reset()
  }

  resetDate(control: any){
    const formControl = `first${control}Date`
    const minField = `minLast${control}`

    this.form.controls[formControl].reset()
    this[minField] = undefined
  }

  check(control: boolean) {
    this.form.get('osSimplificada').setValue(control);
  }

  createForm() {
    this.form = this.builder.group({
      periodoInicioBaseAtivo: null,
      periodoFinalBaseAtivo: null,
      dataAberturaOs: null,
      dataFechamentoOs: null,
      statusAtualCircuito: [],
      osSimplificada: this.osSimplificada
    });
  }

  private initComponent(_this : any) {
    _this.createForm();
  }

  export(){
    if(this.authService.userProfile.email == null){
      this.messageService.error('AT-E012', this.authService.userProfile.name);
    } else {
      console.log(this.form.value)
      this.reportService.generateReportBaseOs(this.form.value).subscribe();
      this.messageService.success('AT-S006');

    }
  }


}
