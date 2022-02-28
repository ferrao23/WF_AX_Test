import { HTMLDomUtils } from "./html-dom-utils";

export class TenantUtils {

    // this.sessionService.updateTenant(this.tenantGid);

    static updateTenant(tenantGid: string, forceChange: boolean): boolean {
        let changed = forceChange

        if (!changed){
            changed = this.hasTenantChanged(tenantGid);
        }

        if (changed) {
            HTMLDomUtils.localStorageRemoveItem("wfgm.tenantinfo");
            HTMLDomUtils.localStorageSetItem("wfgm.tenantgid", tenantGid);
        }

        if (this.authorisedExists()) {
            HTMLDomUtils.localStorageRemoveItem("wfgm.autoauthorise");
        }

        return changed;
    }

    static updateAuthorisedTenant(tenantGid: string): boolean {
        let changed = this.hasTenantChanged(tenantGid);

        if (changed) {
            HTMLDomUtils.localStorageRemoveItem("wfgm.tenantinfo");
            HTMLDomUtils.localStorageSetItem("wfgm.tenantgid", tenantGid);
        }

        if (!this.authorisedExists()) {
            HTMLDomUtils.localStorageSetItem("wfgm.autoauthorise", "true");
        }

        return changed;
    }

    static authorisedExists(): boolean {
        return (HTMLDomUtils.localStorageGetItem("wfgm.autoauthorise") != null)
    }

    static hasTenantChanged(tenantGid: string): boolean {
        let tGid = HTMLDomUtils.localStorageGetItem("wfgm.tenantgid")
        if (!tGid) {
            tGid = HTMLDomUtils.tenantGid;
          }

        if (!tGid && tenantGid) {
            return true;
        }

        if (tGid && tGid.toUpperCase() != tenantGid.toUpperCase()) {
            return true;
        }

        return false;
    }

}
