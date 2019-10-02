import { Injectable } from '@angular/core';
import { cloneDeep, debounce } from 'lodash';

export interface Preferences {
  colorize?: boolean;
  darkMode?: boolean;
  detailsCollapsed?: boolean;
  showWhitespace?: boolean;
  source?: string;
}

export const DEFAULT_PREFERENCES = {
  colorize: true,
  darkMode: true,
  detailsCollapsed: false,
  showWhitespace: false,
  source: ''
};

@Injectable()
export class PreferencesService {
  private prefs: Preferences;
  private debouncedSaveSettings = debounce(() =>
      localStorage.setItem('ffhtml-prefs', JSON.stringify(this.prefs)), 2000);

  constructor() {
    const prefsStr = localStorage.getItem('ffhtml-prefs');

    if (prefsStr) {
      try {
        this.prefs = JSON.parse(prefsStr);

        if (!this.prefs || (typeof this.prefs !== 'object'))
          this.prefs = undefined;
      }
      catch (err) {}
    }
  }

  get(): Preferences {
    return this.prefs && cloneDeep(this.prefs);
  }

  set(newPrefs: Preferences): void {
    this.prefs = newPrefs && cloneDeep(newPrefs);
    this.debouncedSaveSettings();
  }
}
