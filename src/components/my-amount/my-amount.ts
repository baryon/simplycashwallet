import { Component, ElementRef, ViewChild, Input, Output, EventEmitter, AfterViewInit, OnDestroy } from '@angular/core'
import { Wallet } from '../../providers/providers'

//what a mess!

@Component({
  selector: 'my-amount',
  templateUrl: 'my-amount.html'
})
export class MyAmountComponent {
  @Input() label: string
  @Input() placeholder: string
  @Output() satoshisChange = new EventEmitter()
  @ViewChild('amount') amountEl
  @ViewChild('amount', { read: ElementRef }) amountElNative

  private inputEl: any
  private amountSATOSHIS: string
  private touch: boolean = false
  private inputTouch: boolean = false
  private blurTimer: number
  private justBlurred: boolean = false

  private fromUnit: string
  private fromAmount: string

  private preferredUnitCallback: Function
  private priceCallback: Function

  constructor(private wallet: Wallet) {
    this.preferredUnitCallback = (sym: string) => {
      this.updateInputField()
    }
    this.priceCallback = () => {
      if (this.fromUnit && this.fromAmount) {
        this.updateInputField()
        this.amountSATOSHIS = this.wallet.convertUnit(this.fromUnit, 'SATOSHIS', this.fromAmount) || '0'
        this.satoshisChange.emit(parseFloat(this.amountSATOSHIS))
      }
    }
  }

  ngAfterViewInit() {
    this.inputEl = this.amountElNative.nativeElement.querySelector('input')
    this.wallet.subscribePreferredUnit(this.preferredUnitCallback)
    this.wallet.subscribePrice(this.priceCallback)
  }

  ngOnDestroy() {
    this.wallet.unsubscribePreferredUnit(this.preferredUnitCallback)
    this.wallet.unsubscribePrice(this.priceCallback)
  }

  amountInput(ev: any) {
    if (this.inputTouch) {
      this.inputTouch = false
      return
    }
    this.inputTouch = true
    if (this.amountEl.value.length !== 0) {
      return
    }
    this.fromUnit = this.wallet.getPreferredUnit()
    if (this.inputEl.checkValidity()) {
      this.fromAmount = undefined
      this.amountSATOSHIS = undefined
      this.satoshisChange.emit(undefined)
    } else {
      this.fromAmount = '0'
      this.amountSATOSHIS = '0'
      this.satoshisChange.emit(0)
    }
  }

  amountChange(ev: any) {
    if (this.touch) {
      this.touch = false
      return
    }
    this.fromUnit = this.wallet.getPreferredUnit()
    if (this.amountEl.value.length === 0 && this.inputEl.checkValidity()) {
      this.fromAmount = undefined
      this.amountSATOSHIS = undefined
      this.satoshisChange.emit(undefined)
      return
    }
    this.fromAmount = '' + parseFloat(this.amountEl.value) || '0'
    this.amountSATOSHIS = this.wallet.convertUnit(this.fromUnit, 'SATOSHIS', this.amountEl.value) || '0'
    this.satoshisChange.emit(parseFloat(this.amountSATOSHIS))
  }

  changeUnit() {
    this.wallet.changePreferredUnit()
  }

  updateInputField() {
    let unit = this.wallet.getPreferredUnit()
    let newValue: string
    if (typeof this.fromAmount === 'undefined') {
      newValue = ''
    } else {
      newValue = this.wallet.convertUnit(this.fromUnit, unit, this.fromAmount) || '0'
      if (unit === 'BCH') {
        newValue = newValue.replace(/\.?0+$/,'')
      }
    }
    if (this.amountEl.value !== newValue) {
      this.touch = true
      this.amountEl.value = newValue
    }
    if (this.justBlurred) {
      this.amountEl.setFocus()
    }
  }

  getSatoshis() {
    if (typeof this.amountSATOSHIS === 'undefined') {
      return undefined
    }
    return parseFloat(this.amountSATOSHIS)
  }

  setFocus() {
    this.amountEl.setFocus()
  }

  setBlurTimer() {
    window.clearTimeout(this.blurTimer)
    this.justBlurred = true
    this.blurTimer = window.setTimeout(() => {
      this.justBlurred = false
    }, 100)
  }

  clear() {
    this.amountEl.value = ''
  }

}
