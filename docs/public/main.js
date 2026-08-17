import defineCshtmlRazorLanguage from "./highlightjs-cshtml-razor.js";

// Ez a modul a dokumentációs oldal kliensoldali viselkedését inicializálja és hangolja.
const siteConfig = {
    availableVersions: ["10.3.0"],
    availableLanguages: ["en"],
    excludedAffixAnchors: new Set(["#next-step", "#see-also"]),
    emptyAffixClass: "is-empty",
    marketingSiteUrl: "https://recrogridframework.com/",
};

// A Razor szintaxist regisztrálja a kiemelőhöz, hogy a példakódok helyesen jelenjenek meg.
const highlightService = {
    configureRazorLanguage(hljs) {
        if (!hljs || typeof hljs.getLanguage !== "function") {
            return;
        }

        if (!hljs.getLanguage("cshtml-razor")) {
            hljs.registerLanguage("cshtml-razor", defineCshtmlRazorLanguage);
        }

        if (typeof hljs.registerAliases === "function") {
            hljs.registerAliases(["razor", "cshtml"], { languageName: "cshtml-razor" });
        }
    },
};

// Az aktuális dokumentációs útvonal értelmezéséhez és új URL-ek összeállításához ad segédeket.
const pathUtils = {
    normalizePathname(pathname) {
        if (!pathname || pathname === "/") {
            return "/";
        }

        return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
    },

    joinUrlSegments(...segments) {
        const normalizedSegments = segments.filter(Boolean);
        return normalizedSegments.length > 0 ? `/${normalizedSegments.join("/")}` : "/";
    },

    // Eldönti, hogy docs vagy API oldalon járunk, és kiolvassa belőle a fő útvonalrészeket.
    parseDocPath(pathname) {
        const normalized = this.normalizePathname(pathname);
        const segments = normalized.split("/").filter(Boolean);

        for (let index = 0; index <= segments.length - 3; index += 1) {
            if (segments[index + 2] !== "docs") {
                continue;
            }

            return {
                kind: "docs",
                basePath: this.joinUrlSegments(...segments.slice(0, index)),
                language: segments[index],
                version: segments[index + 1],
                tail: segments.slice(index + 3).join("/"),
            };
        }

        for (let index = 0; index <= segments.length - 3; index += 1) {
            if (segments[index] !== "api-reference" || segments[index + 2] !== "api") {
                continue;
            }

            return {
                kind: "api",
                basePath: this.joinUrlSegments(...segments.slice(0, index)),
                language: null,
                version: segments[index + 1],
                tail: segments.slice(index + 3).join("/"),
            };
        }

        return {
            kind: "root",
            basePath: "/",
            language: null,
            version: null,
            tail: "",
        };
    },

    docsUrl(basePath, language, version, tail = "") {
        const pathname = this.joinUrlSegments(basePath, language, version, "docs", tail);
        return tail ? pathname : `${pathname}/`;
    },

    apiUrl(basePath, version, tail = "") {
        const pathname = this.joinUrlSegments(basePath, "api-reference", version, "api", tail);
        return tail ? pathname : `${pathname}/`;
    },
};

// Navigációkor előbb a céloldalt próbálja elérni, és csak hiba esetén vált biztos fallback URL-re.
const navigationService = {
    // Verzió- vagy nyelvváltáskor elkerüli, hogy nem létező oldalra navigáljunk.
    async navigateWithFallback(url, fallbackUrl) {
        if (url === fallbackUrl) {
            window.location.assign(url);
            return;
        }

        try {
            const response = await fetch(url, { method: "HEAD" });
            if (response.ok) {
                window.location.assign(url);
                return;
            }
        } catch {
            // Ignore and fall back.
        }

        window.location.assign(fallbackUrl);
    },
};

// A felső dokumentációs eszköztár DOM-elemeit építi fel és köti össze a váltókkal.
const toolbarView = {
    createLink(label, href, active) {
        const link = document.createElement("a");
        link.className = `rgf-docs-toolbar__link${active ? " is-active" : ""}`;
        link.href = href;
        link.textContent = label;
        return link;
    },

    createSelect(label, options, value, onChange) {
        const wrapper = document.createElement("label");
        wrapper.className = "rgf-docs-toolbar__select";

        const title = document.createElement("span");
        title.className = "rgf-docs-toolbar__label";
        title.textContent = label;
        wrapper.appendChild(title);

        const select = document.createElement("select");
        for (const optionValue of options) {
            const option = document.createElement("option");
            option.value = optionValue;
            option.textContent = optionValue;
            option.selected = optionValue === value;
            select.appendChild(option);
        }
        select.addEventListener("change", () => onChange(select.value));
        wrapper.appendChild(select);
        return wrapper;
    },

    // Az aktuális oldal alapján felépíti a docs/API váltót és a verzióválasztót.
    buildToolbar() {
        const parsed = pathUtils.parseDocPath(window.location.pathname);
        if (parsed.kind === "root") {
            return null;
        }

        const toolbar = document.createElement("div");
        toolbar.className = "rgf-docs-toolbar";

        const nav = document.createElement("nav");
        nav.className = "rgf-docs-toolbar__nav";
        nav.appendChild(
            this.createLink(
                "Documentation",
                pathUtils.docsUrl(
                    parsed.basePath,
                    parsed.language || siteConfig.availableLanguages[0],
                    parsed.version || siteConfig.availableVersions[0],
                    parsed.kind === "docs" ? parsed.tail : "",
                ),
                parsed.kind === "docs",
            ),
        );
        nav.appendChild(
            this.createLink(
                "API Reference",
                pathUtils.apiUrl(
                    parsed.basePath,
                    parsed.version || siteConfig.availableVersions[0],
                    parsed.kind === "api" ? parsed.tail : "",
                ),
                parsed.kind === "api",
            ),
        );
        toolbar.appendChild(nav);

        const controls = document.createElement("div");
        controls.className = "rgf-docs-toolbar__controls";

        if (parsed.kind === "docs" && siteConfig.availableLanguages.length > 1) {
            controls.appendChild(
                this.createSelect("Language", siteConfig.availableLanguages, parsed.language, async (nextLanguage) => {
                    const target = pathUtils.docsUrl(parsed.basePath, nextLanguage, parsed.version, parsed.tail);
                    const fallback = pathUtils.docsUrl(parsed.basePath, nextLanguage, parsed.version);
                    await navigationService.navigateWithFallback(target, fallback);
                }),
            );
        }

        controls.appendChild(
            this.createSelect("Version", siteConfig.availableVersions, parsed.version || siteConfig.availableVersions[0], async (nextVersion) => {
                if (parsed.kind === "docs") {
                    const target = pathUtils.docsUrl(
                        parsed.basePath,
                        parsed.language || siteConfig.availableLanguages[0],
                        nextVersion,
                        parsed.tail,
                    );
                    const fallback = pathUtils.docsUrl(
                        parsed.basePath,
                        parsed.language || siteConfig.availableLanguages[0],
                        nextVersion,
                    );
                    await navigationService.navigateWithFallback(target, fallback);
                    return;
                }

                const target = pathUtils.apiUrl(parsed.basePath, nextVersion, parsed.tail);
                const fallback = pathUtils.apiUrl(parsed.basePath, nextVersion);
                await navigationService.navigateWithFallback(target, fallback);
            }),
        );

        toolbar.appendChild(controls);
        return toolbar;
    },
};

// A jobb oldali affix navigációból kiszűri a rejtendő elemeket és kezeli az üres állapotot.
const affixController = {
    findAffixNav() {
        return document.querySelector("#affix");
    },

    findAffixContainer() {
        return this.findAffixNav()?.closest(".affix") || null;
    },

    isContainerEmpty(node) {
        if (!node) {
            return true;
        }

        if (node.querySelector("a[href]")) {
            return false;
        }

        return !node.textContent?.trim();
    },

    // Felfelé haladva eltávolítja azokat a konténereket, amelyek egy szűrés után teljesen üressé váltak.
    removeEmptyContainers(node, root) {
        let current = node;
        while (current && current !== root) {
            const parent = current.parentElement;
            if (!parent) {
                break;
            }

            if (!this.isContainerEmpty(current)) {
                break;
            }

            current.remove();
            current = parent;
        }
    },

    isExcludedLink(link) {
        const url = new URL(link.href, window.location.href);
        return siteConfig.excludedAffixAnchors.has(url.hash);
    },

    // A linkhez tartozó legjobb eltávolítási célt keresi meg, hogy ne maradjon törött markup maga után.
    findRemovalTarget(link, root) {
        return (
            link.closest("li") ||
            link.closest("ul") ||
            link.closest("p") ||
            link.closest("div") ||
            link.closest("section") ||
            link.parentElement ||
            root
        );
    },

    hasVisibleLinks() {
        const affix = this.findAffixNav();
        if (!affix) {
            return false;
        }

        return Array.from(affix.querySelectorAll("a[href]")).some((link) => !this.isExcludedLink(link));
    },

    // CSS osztállyal jelzi, ha az affixből minden releváns navigációs elem eltűnt.
    syncVisibility() {
        const container = this.findAffixContainer();
        if (!container) {
            return;
        }

        container.classList.toggle(siteConfig.emptyAffixClass, !this.hasVisibleLinks());
    },

    // Kiszedi a kizárt hivatkozásokat, majd utána újraszámolja az affix láthatóságát.
    filterNavigation() {
        const affix = this.findAffixNav();
        if (!affix) {
            return false;
        }

        let removedAny = false;
        for (const link of affix.querySelectorAll("a[href]")) {
            if (!this.isExcludedLink(link)) {
                continue;
            }

            const target = this.findRemovalTarget(link, affix);
            if (target === affix) {
                link.remove();
                continue;
            }

            const parent = target.parentElement;
            target.remove();
            this.removeEmptyContainers(parent, affix);

            removedAny = true;
        }

        this.syncVisibility();
        return removedAny;
    },

    init() {
        this.filterNavigation();
        const affix = this.findAffixNav();
        if (!affix) {
            return;
        }

        const observer = new MutationObserver(() => {
            this.filterNavigation();
        });

        observer.observe(affix, { childList: true, subtree: true });
    },
};

// A fejléc márkalinkjét a marketing oldal fő URL-jére irányítja át.
const brandController = {
    retargetLink() {
        const brandLink = document.querySelector(".navbar-brand");
        if (!brandLink) {
            return;
        }

        brandLink.setAttribute("href", siteConfig.marketingSiteUrl);
    },
};

const repositoryLinkController = {
    markerTitle: "rgf:repository",
    getIconUrl() {
        const siteRoot = document.querySelector('meta[name="docfx:rel"]')?.getAttribute("content") ?? "";
        return `${siteRoot}public/github-mark.svg`;
    },

    // Csak az önálló bekezdésként álló, markerelt linkeket alakítja át kiemelt blokká.
    isStandaloneParagraph(link) {
        const parent = link.parentElement;
        if (!parent || parent.tagName !== "P") {
            return false;
        }

        return parent.childElementCount === 1 && parent.textContent?.trim() === link.textContent?.trim();
    },

    // A markerelt Markdown-linkből felépíti a kívánt repository-fejléc markupot.
    createHeading(link) {
        const heading = document.createElement("h4");
        heading.className = "rgf-repository-link d-flex align-items-center";

        const icon = document.createElement("img");
        icon.className = "pe-2";
        icon.src = this.getIconUrl();
        icon.alt = "";
        heading.appendChild(icon);

        const repositoryLink = document.createElement("a");
        repositoryLink.className = "link-success";
        repositoryLink.href = link.href;
        repositoryLink.target = "_blank";
        repositoryLink.rel = "noopener noreferrer";
        repositoryLink.textContent = link.textContent ?? "";
        heading.appendChild(repositoryLink);

        return heading;
    },

    // Végigmegy a renderelt cikk markerelt linkjein, és helyben lecseréli a támogatottakat.
    upgradeLinks() {
        for (const link of document.querySelectorAll(`article a[title="${this.markerTitle}"]`)) {
            if (!this.isStandaloneParagraph(link)) {
                continue;
            }

            const paragraph = link.parentElement;
            if (!paragraph) {
                continue;
            }

            paragraph.replaceWith(this.createHeading(link));
        }
    },
};

// Összefogja az oldal induláskori inicializálását és a fő UI-elemek bekötését.
const app = {
    findToolbarTarget() {
        return (
            document.querySelector("main") ||
            document.querySelector(".content") ||
            document.body
        );
    },

    // Elindítja a fő inicializálási lépéseket: linkátírás, toolbar beszúrás és affix szűrés.
    start() {
        brandController.retargetLink();
        repositoryLinkController.upgradeLinks();

        const toolbar = toolbarView.buildToolbar();
        if (toolbar) {
            this.findToolbarTarget().prepend(toolbar);
        }

        affixController.init();
    },
};

export default {
    configureHljs: highlightService.configureRazorLanguage,
    start: () => app.start(),
};
