export class HTMLDomUtils {
  static selfLocation = true;
  static tenantGid = "";
  static localStorageEnabled = false;
  static sessionStorageEnabled = false;

  private static initialize = (() => {
    HTMLDomUtils.selfLocation = window.location !== window.parent.location ? false : true;
    HTMLDomUtils.tenantGid = "";

    try {
      HTMLDomUtils.localStorageEnabled = localStorage !== null;
      HTMLDomUtils.sessionStorageEnabled = sessionStorage !== null;
    } catch (error) {
      console.log("%c Cookies are NOT enabled!", "background: #ff0000 ; color: #ffffff");
      console.log("%c ***Your browser was unable to access the site.If this problem persists, please ensure that cookies are enabled or contact support.***", "background: #fffba1 ; color: #000000");
    }
  })();

  //#region local storage

  public static localStorageSetItem(key: string, value: string) {
    if (this.localStorageEnabled) {
      localStorage.setItem(key, value);
    }
    else {
      if (key === "wfgm.tenantgid") {
        this.tenantGid = value;
      }
    }
  }

  public static localStorageGetItem(key: string) {
    if (this.localStorageEnabled) {
      return localStorage.getItem(key);
    }
    else {
      if (key === "wfgm.tenantgid") {
        return this.tenantGid;
      }

      return null;
    }
  }

  public static localStorageRemoveItem(key: string) {
    if (this.localStorageEnabled) {
      localStorage.removeItem(key);
    }
  }

  //#endregion end of local storage

  //#region session storage

  public static sessionStorageSetItem(key: string, value: string) {
    if (this.sessionStorageEnabled) {
      sessionStorage.setItem(key, value);
    }
  }

  public static sessionStorageGetItem(key: string) {
    if (this.sessionStorageEnabled) {
      return sessionStorage.getItem(key);
    }
    else {
      return null;
    }
  }

  public static sessionStorageRemoveItem(key: string) {
    if (this.sessionStorageEnabled) {
      sessionStorage.removeItem(key);
    }
  }

  //#endregion end of session storage

  //#region DOM control

  public static scrollToTop() {
    this.scrollToPosition(0, 0);
  }

  public static scrollToPosition(x, y) {
    window.scrollTo({ top: x, left: y, behavior: "smooth" })
  }

  public static scrollIntoView(el: HTMLElement) {
    if (el) {
      el.scrollIntoView();
    }
  }

  public static setFocus(el: HTMLElement) {
    if (el) {
      el.focus();
    }
  }

  public static scrollIntoViewAndSetFocus(el: HTMLElement) {
    if (el) {
      el.scrollIntoView();
      el.focus();
    }
  }

  //#endregion of DOM control

  public static copyToClipboard(value: string) {
    const inputBox = document.createElement("input");
    inputBox.style.position = "fixed";
    inputBox.style.left = "0";
    inputBox.style.top = "0";
    inputBox.style.opacity = "0";
    inputBox.value = value;
    document.body.appendChild(inputBox);
    inputBox.focus();
    inputBox.select();
    document.execCommand('copy');
    document.body.removeChild(inputBox);
  }
}
