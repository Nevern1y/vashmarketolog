export type ApplicationsNavigationParams = {
    appId?: number | string | null
    highlightIds?: number[]
}

export const navigateToApplications = ({ appId, highlightIds }: ApplicationsNavigationParams = {}) => {
    if (typeof window === "undefined") return

    const url = new URL(window.location.href)
    url.searchParams.set("view", "applications")
    url.searchParams.delete("session")

    if (appId !== undefined && appId !== null) {
        url.searchParams.set("appId", String(appId))
        url.searchParams.delete("highlight")
    } else {
        url.searchParams.delete("appId")
    }

    if (highlightIds && highlightIds.length > 0) {
        url.searchParams.set("highlight", highlightIds.join(","))
        url.searchParams.delete("appId")
    } else if (!appId) {
        url.searchParams.delete("highlight")
    }

    window.history.pushState(window.history.state, "", url.toString())
    window.dispatchEvent(new Event("popstate"))
}
