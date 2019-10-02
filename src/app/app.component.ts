import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HtmlParser, stylizeHtml } from 'fortissimo-html';
// import { isEqual } from 'lodash';
// import { MenuItem } from 'primeng/api';

import { DEFAULT_PREFERENCES, Preferences, PreferencesService } from './preferences.service';

function screenTooSmallForTooltip(): boolean {
  return window.innerWidth < 480 || window.innerHeight < 480;
}

@Component({
  selector: 'fh-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy, OnInit {
  private _detailsCollapsed = false;
  private needsMouseLeave: HTMLElement;

  private clickListener = () => {
    if (this.needsMouseLeave) {
      this.needsMouseLeave.dispatchEvent(new MouseEvent('mouseleave'));
      this.needsMouseLeave = undefined;
    }
  };

  // quoteOptions = [
  //   { label: 'DOUBLE', value: Quote.DOUBLE },
  //   { label: 'SINGLE', value: Quote.SINGLE },
  //   { label: 'PREFER_DOUBLE', value: Quote.PREFER_DOUBLE },
  //   { label: 'PREFER_SINGLE', value: Quote.PREFER_SINGLE }
  // ];

  banner: SafeHtml;
  inputInfo = '(tbd)';
  output: SafeHtml | string = '';
  prefs: Preferences;
  showInputInfo = false;
  source = '';

  get detailsCollapsed(): boolean { return this._detailsCollapsed; }
  set detailsCollapsed(newValue: boolean) {
    if (this._detailsCollapsed !== newValue) {
      this._detailsCollapsed = newValue;
      this.updatePrefs();
    }
  }

  constructor(
    private http: HttpClient,
    private prefsService: PreferencesService,
    private sanitizer: DomSanitizer,
  ) {
    http.get('assets/banner.html', { responseType: 'text' })
      .subscribe(content => this.banner = sanitizer.bypassSecurityTrustHtml(content.toString()));

    this.prefs = prefsService.get() || DEFAULT_PREFERENCES;

    Object.keys(DEFAULT_PREFERENCES).forEach(key => {
      if (!(key in this.prefs))
        this.prefs[key] = DEFAULT_PREFERENCES[key];
    });

    this._detailsCollapsed = !!this.prefs.detailsCollapsed;
    this.source = this.prefs.source || '';
  }

  ngOnInit(): void {
    document.addEventListener('click', this.clickListener);
    this.onChange(false, false);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.clickListener);
  }

  touchToHover(event: TouchEvent): void {
    event.preventDefault();

    if (screenTooSmallForTooltip())
      this.showInputInfo = true;
    else if (this.needsMouseLeave) {
      this.needsMouseLeave.dispatchEvent(new MouseEvent('mouseleave'));
      this.needsMouseLeave = undefined;
    }
    else {
      this.needsMouseLeave = event.target as HTMLElement;
      this.needsMouseLeave.dispatchEvent(new MouseEvent('mouseenter'));
    }
  }

  clearSource(): void {
    this.source = '';
    this.onChange();
  }

  onChange(delayError = false, updateThePrefs = true): void {
    if (updateThePrefs)
      this.updatePrefs();

    const parser = new HtmlParser();
    const dom = parser.parse(this.source).domRoot;
    const styled = stylizeHtml(dom, {
      dark: this.prefs.darkMode,
      outerTag: 'div',
      showWhitespace: this.prefs.showWhitespace
    });
    this.output = this.sanitizer.bypassSecurityTrustHtml(styled);
  }

  private reparse(delayError = false): void {
  }

  private updatePrefs(): void {
    const prefs = {
      detailsCollapsed: this.detailsCollapsed,
      source: this.source,
    };

    this.prefsService.set(prefs);
  }
}
