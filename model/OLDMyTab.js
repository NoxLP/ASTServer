export class MyTab {
  constructor(chromeTab) {
    console.log(chromeTab)
    if(chromeTab) {
      this.url = chromeTab.url;
      this.tabId = chromeTab.id;
      this.muted = chromeTab.mutedInfo.muted || false;
      this.pinned = chromeTab.pinned;
      this.selected = chromeTab.selected;
      this.title = chromeTab.title;
    }
  }
  static mapFromJSON(JSON) {
    let tab = new MyTab();
    tab.url = JSON.url;
    tab.tabId = JSON.id;
    tab.muted = JSON.muted;
    tab.pinned = JSON.pinned;
    tab.selected = JSON.selected;
    tab.title = JSON.title;
    return tab;
  }
  equalsChromeTabByUrl(chromeTab) {
    return chromeTab.url === this.url;
  }
  equalsChromeTabById(chromeTab) {
    return chromeTab.id === this.tabId;
  }
}