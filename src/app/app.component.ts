import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { AppUpdateService } from './services/update.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  blueForm: FormGroup = new FormGroup({
    gbp: new FormControl(''),
    eur: new FormControl(''),
    ars: new FormControl(''),
  });
  title = 'Blue Europe';
  blueRate: string = '';
  gbpRate: string = '';
  lastUpdate: Date = new Date();
  gbpFormatter!: Intl.NumberFormat;
  arsFormatter!: Intl.NumberFormat;
  eurFormatter!: Intl.NumberFormat;

  constructor(protected updateService: AppUpdateService) {}

  async ngOnInit(): Promise<void> {
    this.setFormatters();
    await this.getRates();
  }

  async getRates() {
    try {
      const blueResponse = await (
        await fetch('https://api.bluelytics.com.ar/v2/latest')
      ).json();
      this.blueRate = blueResponse?.blue_euro?.value_sell;
      localStorage.setItem('blueRate', this.blueRate.toString());

      const gbpRespnse = await (
        await fetch('https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/eur/gbp.json')
      ).json();
      this.gbpRate = gbpRespnse?.gbp;
      localStorage.setItem('gbpRate', this.gbpRate);
      this.lastUpdate = new Date();
    } catch (error) {
      const saveBlueRate = localStorage.getItem('blueRate');
      if (saveBlueRate) {
        this.blueRate = saveBlueRate;
      }
      const savedgbpRate = localStorage.getItem('gbpRate');
      if (savedgbpRate) {
        this.gbpRate = savedgbpRate;
      }
    }
  }

  convert(e: any) {
    let targetId = '';
    if (!e) {
      if (
        this.blueForm.get('gbp')?.value &&
        this.blueForm.get('gbp')?.value > 0
      ) {
        targetId = 'gbp';
      } else if (
        this.blueForm.get('eur')?.value &&
        this.blueForm.get('eur')?.value > 0
      ) {
        targetId = 'eur';
      } else if (
        this.blueForm.get('ars')?.value &&
        this.blueForm.get('ars')?.value > 0
      ) {
        targetId = 'ars';
      }
    } else {
      targetId = e.target.id;
    }
    if (e && !e.target.value.endsWith(',')) {
      switch (targetId) {
        case 'gbp':
          let gbpValue = this.blueForm.get('gbp')?.value;
          gbpValue = gbpValue.replace(/\./g, '');
          gbpValue = gbpValue.replace(',', '.');
          if (gbpValue.indexOf('GBP') > -1) {
            gbpValue = gbpValue.substring(4);
          }
          this.blueForm.patchValue({
            eur: this.eurFormatter.format(gbpValue / +this.gbpRate),
            ars: this.arsFormatter.format(
              (gbpValue / +this.gbpRate) *
              +this.blueRate
            ),
            gbp: this.gbpFormatter.format(gbpValue.replace(',', '.')),
          });
          break;
        case 'eur':
          let eurValue = this.blueForm.get('eur')?.value;
          eurValue = eurValue.replace(/\./g, '');
          eurValue = eurValue.replace(',', '.');
          if (eurValue.indexOf('EUR') > -1) {
            eurValue = eurValue.substring(4);
          }
          this.blueForm.patchValue({
            gbp: this.gbpFormatter.format(eurValue * +this.gbpRate),
            ars: this.arsFormatter.format(eurValue * +this.blueRate),
            eur: this.eurFormatter.format(eurValue.replace(',', '.')),
          });
          break;
        case 'ars':
          let arsValue = this.blueForm.get('ars')?.value;
          arsValue = arsValue.replace(/\./g, '');
          arsValue = arsValue.replace(',', '.');
          if (arsValue.indexOf('$') > -1) {
            arsValue = arsValue.substring(2);
          }
          this.blueForm.patchValue({
            gbp: this.gbpFormatter.format(
              (arsValue / +this.blueRate) *
              +this.gbpRate
            ),
            eur: this.eurFormatter.format(arsValue / +this.blueRate),
            ars: this.arsFormatter.format(arsValue.replace(',', '.')),
          });
          break;
        default:
          this.blueForm.reset();
          break;
      }
    }
  }

  restrictChars(e: any) {
    const charCode = (e.which) ? e.which : e.keyCode;
    if (charCode == 46 || charCode === 188 || charCode === 190) {
      if (e.target.value.indexOf('.') === -1) {
        return true;
      } else {
        return false;
      }
    } else {
      if (charCode > 31 &&
        (charCode < 48 || charCode > 57) &&
        charCode !== 96 && charCode !== 97 && charCode !== 98 &&
        charCode !== 99 && charCode !== 100 && charCode !== 101 &&
        charCode !== 102 && charCode !== 103 && charCode !== 104 &&
        charCode !== 105)
        return false;
    }
    return true;
  }

  setFormatters() {
    this.gbpFormatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'GBP', maximumSignificantDigits: 10});
    this.arsFormatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumSignificantDigits: 10});
    this.eurFormatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'EUR', maximumSignificantDigits: 10});
  }
}
