/*
 * CatCheck v4.2 — okunabilir kaynak kodu
 * Türkçe Vikipedi için kategori kontrol ve düzenleme aracı.
 * GitHub Pages üzerinde CatCheck-v4.2.js adıyla yayımlanabilir.
 * CSS: Kullanıcı:İmmortalance/js/CatCheck.css
 */
!(function () {
    "use strict";
    if (!mw.config.get("wgIsMainPage")) {
        var ns = mw.config.get("wgNamespaceNumber");
        if ("view" === mw.config.get("wgAction") && (0 === ns || 14 === ns)) {
            var pageName = mw.config.get("wgPageName"),
                trApi = mw.util.wikiScript("api"),
                enApi = "https://en.wikipedia.org/w/api.php",
                wdApi = "https://www.wikidata.org/w/api.php",
                buttonId = "immortalance-kategori-araci",
                resultId = "immortalance-kategori-sonuclari";
            mw.loader.load(
                mw.util.getUrl("Kullanıcı:İmmortalance/js/CatCheck.css", {
                    action: "raw",
                    ctype: "text/css",
                }),
                "text/css",
            );
            var catCheckCredit = "[[Kullanıcı:İmmortalance/js/CatCheck.js|''CatCheck v4.2'']]",
                catCheckScanState = null,
                catCheckPanel = null,
                catCheckLocalApi = new mw.Api(),
                catCheckForeignApis = {},
                catCheckScanButton = null,
                catCheckLastScan = null;
            $(function () {
                createButton();
            });
        }
    }
    function makeElement(tag) {
        return document.createElement(tag);
    }
    function makeText(text) {
        return document.createTextNode(text);
    }
    function categoryWikilink(name) {
        return "[\u005bKategori:" + name.replace(/_/g, " ") + "]]";
    }
    function categoryLineRegex(name) {
        var pattern = name.replace(/_/g, " ").trim().split(/\s+/).map(escapeRegExp).join("[ _]+");
        return new RegExp(
            "^[ \\t]*\\[\\[[ \\t]*" +
                escapeRegExp("Kategori:") +
                "[ \\t]*" +
                pattern +
                "[ \\t]*(?:\\|[^\\]\\r\\n]*)?\\]\\][ \\t]*(?:\\r?\\n|$)",
            "gim",
        );
    }
    function isIgnoredParentCategory(name) {
        return (
            normalize(name.replace(/^Kategori:/i, "")) ===
            normalize("Commons kategori bağlantısı Vikiveri'de tanımlı olan sayfalar")
        );
    }
    function setButtonText(button, text) {
        (button.isConnected &&
            (text.indexOf("...") >= 0 || 0 === text.indexOf("✓")) &&
            updateWindowProgress(text),
            button.dataset.ccAction ||
                (button.dataset.ccAction = /durdur/i.test(text)
                    ? "stop"
                    : /olmayan|dil bağlant|üye sayı|hesapla/i.test(text)
                      ? "discover"
                      : /kontrol|mevcut olanları çıkar/i.test(text)
                        ? "check"
                        : /taşı/i.test(text)
                          ? "move"
                          : /kaldır|sil|sıfırla/i.test(text)
                            ? "remove"
                            : /ekle/i.test(text)
                              ? "add"
                              : "neutral"),
            "stop" === button.dataset.ccAction
                ? (button.dataset.ccAction = /devam et/i.test(text) ? "resume" : "stop")
                : "resume" === button.dataset.ccAction &&
                  /durdur/i.test(text) &&
                  (button.dataset.ccAction = "stop"),
            button.classList.toggle("catcheck-busy", text.indexOf("...") >= 0),
            button.classList.toggle("catcheck-action-done", 0 === text.indexOf("✓")),
            (button.textContent = text),
            button.removeAttribute("aria-label"));
        var position = text.indexOf("...");
        if (!(position < 0)) {
            (button.setAttribute("aria-label", text),
                (button.textContent = ""),
                button.appendChild(makeText(text.substring(0, position))));
            var holder = makeElement("span");
            ((holder.className = "catcheck-dots-holder"),
                holder.setAttribute("aria-hidden", "true"));
            for (var dotIndex = 0; dotIndex < 3; dotIndex++) {
                var dot = makeElement("span");
                ((dot.className = "catcheck-dot catcheck-dot-" + dotIndex),
                    (dot.textContent = "."),
                    holder.appendChild(dot));
            }
            (button.appendChild(holder),
                button.appendChild(makeText(text.substring(position + 3))));
        }
    }
    function scanGate(scan) {
        return scan && scan.paused
            ? new Promise(function (resolve) {
                  scan.waiters.push(resolve);
              })
            : Promise.resolve();
    }
    // Tarama durumu, duraklatma ve sonuçların aşamalı gösterimi.
    function beginScan(button, existingScan, full) {
        (choices = document.getElementById("catcheck-scope-choices")) &&
            ensureResultsPanel().body.prepend(choices);
        var previous = document.getElementById(resultId);
        previous && !existingScan && previous.remove();
        var old = document.getElementById("catcheck-scan-controls");
        old && old.remove();
        var scan = existingScan || {
            full: !!full,
            paused: false,
            waiters: [],
            button: button,
            sections: {},
            rendered: {},
            statuses: {},
        };
        ((scan.complete = false), setScopeDisabled(true));
        var controls = makeElement("div");
        controls.id = "catcheck-scan-controls";
        var pause = makeElement("button");
        ((pause.type = "button"),
            setButtonText(pause, "Taramayı durdur"),
            controls.appendChild(pause));
        var status = makeElement("span");
        ((status.className = "catcheck-scan-status"),
            (status.textContent = "Sonuçlar hazır oldukça gösterilecek."),
            controls.appendChild(status),
            pause.addEventListener("click", function () {
                ((scan.paused = !scan.paused),
                    Object.keys(scan.statuses).forEach(function (key) {
                        ("Kontrol ediliyor" !== scan.statuses[key] &&
                            "Duraklatıldı" !== scan.statuses[key]) ||
                            setScanSection(
                                scan,
                                key,
                                scan.paused ? "Duraklatıldı" : "Kontrol ediliyor",
                            );
                    }),
                    setButtonText(
                        pause,
                        scan.paused ? "Kaldığı yerden devam et" : "Taramayı durdur",
                    ),
                    (status.textContent = scan.paused
                        ? "Tarama duraklatıldı. Başlamış istekler tamamlanabilir; yeni sorgu gönderilmez."
                        : "Tarama devam ediyor."),
                    updateWindowProgress(status.textContent),
                    scan.paused ||
                        scan.waiters.splice(0).forEach(function (resolve) {
                            resolve();
                        }));
            }));
        var choices,
            panel = ensureResultsPanel();
        return (
            panel.desktop.matches && !panel.dialog.open && panel.dialog.showModal(),
            (choices = document.getElementById("catcheck-scope-choices"))
                ? choices.after(controls)
                : panel.body.prepend(controls),
            (scan.controls = controls),
            (catCheckScanState = scan),
            14 === ns &&
                (showCategoryPageResults(
                    existingScan ? scan.sections.articles.items : [],
                    [],
                    [],
                    [],
                    null,
                    [],
                    [],
                    [],
                    scan.missingArticles || [],
                    void 0,
                    scan,
                ),
                existingScan || setScanSection(scan, "articles", "Kontrol ediliyor")),
            scan
        );
    }
    function endScan(scan) {
        (updateWindowProgress(scan.complete ? "✓ Tarama tamamlandı" : "Tarama sona erdi"),
            setScopeDisabled(false),
            reopenResultsPanel(),
            14 !== ns ||
                scan.complete ||
                Object.keys(scan.statuses).forEach(function (key) {
                    scan.rendered[key] || setScanSection(scan, key, "Tamamlanamadı");
                }),
            (scan.paused = false),
            scan.waiters.splice(0).forEach(function (resolve) {
                resolve();
            }),
            scan.controls.remove(),
            catCheckScanState === scan && (catCheckScanState = null));
    }
    function setScanSection(scan, key, status) {
        scan.statuses[key] = status;
        var box = document.getElementById(resultId);
        if (box) {
            var group = box.querySelector('[data-scan-key="' + key + '"]');
            if (group) {
                var label = group.querySelector(".catcheck-section-status");
                (label ||
                    (((label = makeElement("small")).className = "catcheck-section-status"),
                    group.querySelector("summary").appendChild(label)),
                    (label.textContent = status),
                    label.classList.toggle("catcheck-section-done", "Tamamlandı" === status));
            }
        }
    }
    function showScanPreview(scan, key, title, items) {
        ((scan.sections[key] = {
            title: title,
            items: items,
        }),
            (scan.statuses[key] = "Tamamlandı"),
            14 === ns &&
                showCategoryPageResults(
                    scan.sections.articles ? scan.sections.articles.items : [],
                    scan.sections.categories ? scan.sections.categories.items : [],
                    [],
                    [],
                    null,
                    scan.sections.parents ? scan.sections.parents.items : [],
                    [],
                    [],
                    scan.missingArticles || [],
                    void 0,
                    scan,
                ));
    }
    function reopenResultsPanel() {
        catCheckPanel &&
            catCheckPanel.desktop.matches &&
            !catCheckPanel.dialog.open &&
            catCheckPanel.dialog.showModal();
    }
    function ensureResultsPanel() {
        if (catCheckPanel) return catCheckPanel;
        var inline = makeElement("div"),
            heading = document.querySelector("#firstHeading");
        heading.parentNode.insertBefore(inline, heading.nextSibling);
        var dialog = makeElement("dialog");
        ((dialog.className = "catcheck-dialog"),
            dialog.setAttribute("aria-label", "CatCheck kategori kontrol sonuçları"));
        var close = makeElement("button");
        ((close.type = "button"),
            (close.className = "catcheck-close"),
            (close.textContent = "Pencereyi kapat"),
            close.addEventListener("click", function () {
                dialog.close();
            }));
        var header = makeElement("div");
        header.className = "catcheck-window-header";
        var progress = makeElement("span");
        ((progress.id = "catcheck-window-progress"),
            progress.setAttribute("role", "status"),
            progress.setAttribute("aria-live", "polite"),
            (progress.textContent = "Tarama kapsamını seçin."),
            header.appendChild(progress),
            header.appendChild(close),
            dialog.appendChild(header));
        var body = makeElement("div"),
            reopen = makeElement("button");
        ((reopen.type = "button"),
            (reopen.textContent = "CatCheck sonuçlarını aç"),
            (reopen.hidden = true),
            inline.appendChild(reopen),
            document.body.appendChild(dialog));
        var desktop = window.matchMedia("(min-width: 721px)");
        function layout() {
            desktop.matches
                ? (dialog.appendChild(body),
                  (reopen.hidden = false),
                  dialog.open || dialog.showModal())
                : (dialog.open && dialog.close(), inline.appendChild(body), (reopen.hidden = true));
        }
        return (
            reopen.addEventListener("click", function () {
                dialog.open || dialog.showModal();
            }),
            desktop.addEventListener("change", layout),
            (catCheckPanel = {
                body: body,
                dialog: dialog,
                desktop: desktop,
            }),
            layout(),
            catCheckPanel
        );
    }
    // MediaWiki API istekleri ve bağlantı hatalarında yeniden deneme.
    function apiRequest(url, params, name, bypassScan) {
        var scan = bypassScan ? null : catCheckScanState;
        return scanGate(scan)
            .then(function () {
                return mw.loader.using("mediawiki.ForeignApi").then(function () {
                    var api =
                        url === trApi
                            ? catCheckLocalApi
                            : catCheckForeignApis[url] ||
                              (catCheckForeignApis[url] = new mw.ForeignApi(url, {
                                  anonymous: true,
                              }));
                    return (function attempt(retries) {
                        return scanGate(scan).then(function () {
                            return new Promise(function (resolve, reject) {
                                api.get(params).then(resolve, function (code, details) {
                                    if (
                                        !("http" === code && retries > 0) ||
                                        (details && details.xhr && details.xhr.status)
                                    ) {
                                        var message =
                                            (details && details.error && details.error.info) ||
                                            (details && details.textStatus) ||
                                            code ||
                                            "Bilinmeyen hata";
                                        reject(
                                            new Error(name + " API isteği başarısız: " + message),
                                        );
                                    } else
                                        setTimeout(function () {
                                            attempt(retries - 1).then(resolve, reject);
                                        }, 1e3);
                                });
                            });
                        });
                    })(2);
                });
            })
            .then(function (data) {
                return scanGate(scan).then(function () {
                    return data;
                });
            });
    }
    function trApiPost(params) {
        return catCheckLocalApi.postWithToken("csrf", params);
    }
    function resetActionButton(button) {
        (button.classList.remove("catcheck-action-done"), (button.title = ""));
    }
    function markCompleted(button) {
        (reopenResultsPanel(),
            (button.disabled = false),
            setButtonText(button, "✓ Tamamlandı"),
            button.removeAttribute("title"));
    }
    function setGroupProgress(button, done, total) {
        var group =
            button.closest("details.catcheck-group") ||
            document.querySelector("#" + resultId + " details.catcheck-group");
        if (group) {
            var summary = group.querySelector("summary"),
                count = summary.querySelector(".catcheck-progress");
            (count ||
                (((count = makeElement("span")).className = "catcheck-progress"),
                summary.appendChild(count)),
                (count.textContent = " (" + done + "/" + total + ")"),
                count.classList.toggle("catcheck-progress-done", total > 0 && done >= total),
                total > 0 && done >= total && (count.textContent += " ✓"));
        }
    }
    function appendCategoryLinks(content, links) {
        if (!links.length) return content;
        var base = content.replace(/\s+$/, "");
        return (base ? base + "\n" : "") + links.join("\n") + "\n";
    }
    function escapeRegExp(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    function normalize(text) {
        return text.replace(/_/g, " ").trim().toLocaleLowerCase("tr-TR");
    }
    function createReadProgress(label, total, progressButton) {
        var button = progressButton || catCheckScanButton,
            seen = {},
            completed = 0;
        function render() {
            button &&
                setButtonText(
                    button,
                    label +
                        "... (" +
                        (null == total
                            ? completed.toLocaleString("tr-TR") + " alındı"
                            : Math.min(completed, total).toLocaleString("tr-TR") +
                              "/" +
                              total.toLocaleString("tr-TR")) +
                        ")",
                );
        }
        return (
            render(),
            {
                request: function (url, params, name) {
                    return apiRequest(url, params, name).then(function (data) {
                        if (params.titles || params.ids)
                            (params.titles || params.ids).split("|").forEach(function (title) {
                                seen[title] || ((seen[title] = true), completed++);
                            });
                        else if (data.query && data.query.categorymembers)
                            completed += data.query.categorymembers.length;
                        else if (data.query && data.query.pages) {
                            var pages = Object.keys(data.query.pages).map(function (id) {
                                return data.query.pages[id];
                            });
                            completed +=
                                "categories" === params.prop
                                    ? pages.reduce(function (sum, page) {
                                          return sum + (page.categories || []).length;
                                      }, 0)
                                    : pages.length;
                        }
                        return (render(), data);
                    });
                },
            }
        );
    }
    function getTurkishCategories() {
        return createReadProgress("Türkçe kategoriler alınıyor", null)
            .request(
                trApi,
                {
                    action: "query",
                    prop: "categories",
                    titles: pageName,
                    cllimit: "max",
                },
                "Türkçe Vikipedi",
            )
            .then(function (data) {
                var result = [];
                return data.query && data.query.pages
                    ? (Object.keys(data.query.pages).forEach(function (id) {
                          var page = data.query.pages[id];
                          page.categories &&
                              page.categories.forEach(function (cat) {
                                  result.push(
                                      cat.title
                                          .replace(
                                              new RegExp("^" + escapeRegExp("Kategori:"), "i"),
                                              "",
                                          )
                                          .trim(),
                                  );
                              });
                      }),
                      result)
                    : result;
            });
    }
    function getEnglishCategories(title) {
        return createReadProgress("İngilizce kategoriler alınıyor", null)
            .request(
                enApi,
                {
                    action: "query",
                    prop: "categories",
                    titles: title,
                    cllimit: "max",
                    clshow: "!hidden",
                },
                "İngilizce Vikipedi",
            )
            .then(function (data) {
                var result = [];
                return data.query && data.query.pages
                    ? (Object.keys(data.query.pages).forEach(function (id) {
                          var page = data.query.pages[id];
                          page.categories &&
                              page.categories.forEach(function (cat) {
                                  "" !== cat.hidden && result.push(cat.title);
                              });
                      }),
                      result)
                    : result;
            });
    }
    function getCategoryItems(categories) {
        for (
            var readProgress = createReadProgress(
                    "Kategoriler Vikiveri ile eşleştiriliyor",
                    categories.length,
                ),
                result = {},
                batches = [],
                i = 0;
            i < categories.length;
            i += 50
        )
            batches.push(categories.slice(i, i + 50));
        return batches
            .reduce(function (promise, batch) {
                return promise.then(function () {
                    return readProgress
                        .request(
                            enApi,
                            {
                                action: "query",
                                prop: "pageprops",
                                titles: batch.join("|"),
                                ppprop: "wikibase_item",
                            },
                            "İngilizce kategori",
                        )
                        .then(function (data) {
                            data.query &&
                                data.query.pages &&
                                Object.keys(data.query.pages).forEach(function (id) {
                                    var page = data.query.pages[id];
                                    page.pageprops &&
                                        page.pageprops.wikibase_item &&
                                        (result[page.title] = page.pageprops.wikibase_item);
                                });
                        });
                });
            }, Promise.resolve())
            .then(function () {
                return result;
            });
    }
    function getTurkishCategoryLinks(qids) {
        for (
            var readProgress = createReadProgress(
                    "Türkçe kategori karşılıkları eşleştiriliyor",
                    qids.length,
                ),
                result = {},
                batches = [],
                i = 0;
            i < qids.length;
            i += 50
        )
            batches.push(qids.slice(i, i + 50));
        return batches
            .reduce(function (promise, batch) {
                return promise.then(function () {
                    return readProgress
                        .request(
                            wdApi,
                            {
                                action: "wbgetentities",
                                ids: batch.join("|"),
                                props: "sitelinks",
                            },
                            "Vikiveri kategorileri",
                        )
                        .then(function (data) {
                            data.entities &&
                                Object.keys(data.entities).forEach(function (qid) {
                                    var entity = data.entities[qid];
                                    if (entity.sitelinks && entity.sitelinks.trwiki) {
                                        var title = entity.sitelinks.trwiki.title;
                                        0 === title.indexOf("Kategori:") &&
                                            (result[qid] = title.substring(9).trim());
                                    }
                                });
                        });
                });
            }, Promise.resolve())
            .then(function () {
                return result;
            });
    }
    // Madde ekranı: kategori önerileri ve otomatik yinelenen üst kategori kontrolü.
    async function findCategorySuggestions(button) {
        catCheckScanButton = button;
        var itemId,
            scan = beginScan(button);
        ((button.disabled = true), setButtonText(button, "Kategoriler aranıyor..."));
        try {
            var englishArticle = await ((itemId = mw.config.get("wgWikibaseItemId")),
            itemId
                ? apiRequest(
                      wdApi,
                      {
                          action: "wbgetentities",
                          ids: itemId,
                          props: "sitelinks",
                      },
                      "Vikiveri",
                  ).then(function (data) {
                      var entity = data.entities[itemId];
                      return entity && entity.sitelinks && entity.sitelinks.enwiki
                          ? entity.sitelinks.enwiki.title
                          : null;
                  })
                : Promise.reject(new Error("Bu maddenin Vikiveri bağlantısı bulunamadı.")));
            if (!englishArticle)
                return void showResults([], "Bu maddenin enwiki karşılığı bulunamadı.");
            var turkishCategories = await getTurkishCategories(),
                englishCategories = await getEnglishCategories(englishArticle);
            if (!englishCategories.length)
                return void showResults([], "İngilizce maddede uygun kategori bulunamadı.");
            var categoryItems = await getCategoryItems(englishCategories),
                qids = [];
            Object.keys(categoryItems).forEach(function (category) {
                var qid = categoryItems[category];
                -1 === qids.indexOf(qid) && qids.push(qid);
            });
            var turkishLinks = await getTurkishCategoryLinks(qids),
                existing = {};
            turkishCategories.forEach(function (category) {
                existing[normalize(category)] = true;
            });
            var suggestions = [];
            (Object.keys(categoryItems).forEach(function (englishCategory) {
                var qid = categoryItems[englishCategory],
                    turkishCategory = turkishLinks[qid];
                turkishCategory &&
                    (existing[normalize(turkishCategory)] ||
                        suggestions.some(function (item) {
                            return item.tr && normalize(item.tr) === normalize(turkishCategory);
                        }) ||
                        suggestions.push({
                            tr: turkishCategory,
                            en: englishCategory,
                            hasTurkish: true,
                        }));
            }),
                englishCategories.forEach(function (englishCategory) {
                    var qid = categoryItems[englishCategory];
                    (qid && turkishLinks[qid]) ||
                        suggestions.some(function (item) {
                            return item.en === englishCategory;
                        }) ||
                        suggestions.push({
                            tr: null,
                            en: englishCategory,
                            hasTurkish: false,
                        });
                }),
                showScanPreview(scan, "categories", "Kategori önerileri", suggestions),
                showResults(suggestions, null, "category"));
        } catch (error) {
            (console.error("[Kategori aracı]", error),
                showResults([], "Hata oluştu: " + (error.message || String(error))));
        } finally {
            var redundancy = document.querySelector(".catcheck-article-redundancy");
            if (redundancy && redundancy.catcheckRun) await redundancy.catcheckRun(true);
            (endScan(scan),
                catCheckScanButton === button && (catCheckScanButton = null),
                (button.disabled = false),
                setButtonText(button, "CatCheck"));
        }
    }
    async function getEnglishMembers(category) {
        var readProgress = createReadProgress("İngilizce maddeler alınıyor", null),
            result = [],
            cont = null;
        do {
            var params = {
                action: "query",
                list: "categorymembers",
                cmtitle: category,
                cmnamespace: "0",
                cmlimit: "500",
            };
            cont && (params.cmcontinue = cont);
            var data = await readProgress.request(enApi, params, "İngilizce kategori");
            (data.query &&
                data.query.categorymembers &&
                data.query.categorymembers.forEach(function (item) {
                    result.push(item.title);
                }),
                (cont = data.continue && data.continue.cmcontinue));
        } while (cont);
        return result;
    }
    async function getEnglishSubcategories(category) {
        var readProgress = createReadProgress("İngilizce alt kategoriler alınıyor", null),
            result = [],
            cont = null;
        do {
            var params = {
                action: "query",
                list: "categorymembers",
                cmtitle: category,
                cmnamespace: "14",
                cmlimit: "500",
            };
            cont && (params.cmcontinue = cont);
            var data = await readProgress.request(enApi, params, "İngilizce alt kategoriler");
            (data.query &&
                data.query.categorymembers &&
                data.query.categorymembers.forEach(function (item) {
                    result.push(item.title);
                }),
                (cont = data.continue && data.continue.cmcontinue));
        } while (cont);
        return result;
    }
    function getMemberCountStorageKey() {
        return "catcheck-member-count-progress-v1:" + pageName;
    }
    function loadMemberCountProgress() {
        try {
            var raw = localStorage.getItem(getMemberCountStorageKey());
            if (!raw) return {};
            var data = JSON.parse(raw);
            return data && "object" == typeof data ? data : {};
        } catch (error) {
            return (console.warn("[CatCheck] Kayıtlı üye sayımı okunamadı:", error), {});
        }
    }
    function saveMemberCountProgress(progress) {
        try {
            localStorage.setItem(getMemberCountStorageKey(), JSON.stringify(progress));
        } catch (error) {
            console.warn("[CatCheck] Üye sayımı ilerlemesi kaydedilemedi:", error);
        }
    }
    async function getExistingTurkishSubcategories(category) {
        var readProgress = createReadProgress("Türkçe alt kategoriler alınıyor", null),
            result = {
                lookup: {},
                titles: [],
            },
            cont = null;
        do {
            var params = {
                action: "query",
                list: "categorymembers",
                cmtitle: category,
                cmnamespace: "14",
                cmlimit: "500",
            };
            cont && (params.cmcontinue = cont);
            var data = await readProgress.request(trApi, params, "Mevcut Türkçe alt kategoriler");
            (data.query &&
                data.query.categorymembers &&
                data.query.categorymembers.forEach(function (item) {
                    var clean = item.title
                        .replace(new RegExp("^" + escapeRegExp("Kategori:"), "i"), "")
                        .trim();
                    ((result.lookup[normalize(clean)] = true), result.titles.push(item.title));
                }),
                (cont = data.continue && data.continue.cmcontinue));
        } while (cont);
        return result;
    }
    async function getExistingTurkishCategoryMembers(category) {
        var readProgress = createReadProgress("Türkçe kategori maddeleri alınıyor", null),
            result = [],
            cont = null;
        do {
            var params = {
                action: "query",
                list: "categorymembers",
                cmtitle: category,
                cmnamespace: "0",
                cmlimit: "500",
            };
            cont && (params.cmcontinue = cont);
            var data = await readProgress.request(trApi, params, "Mevcut kategori maddeleri");
            (data.query &&
                data.query.categorymembers &&
                data.query.categorymembers.forEach(function (item) {
                    result.push(item.title);
                }),
                (cont = data.continue && data.continue.cmcontinue));
        } while (cont);
        return result;
    }
    async function findMembersAlsoInSubcategories(
        parentMembers,
        subcategoryTitles,
        progressButton,
    ) {
        var readProgress = createReadProgress(
            "Türkçe alt kategori üyelikleri kontrol ediliyor",
            parentMembers.length,
            progressButton,
        );
        if (!parentMembers.length || !subcategoryTitles.length) return [];
        var subcategoryLookup = {},
            matches = {};
        subcategoryTitles.forEach(function (title) {
            subcategoryLookup[normalize(title.replace(/^Kategori:/i, ""))] = title.replace(
                /^Kategori:/i,
                "",
            );
        });
        for (var i = 0; i < parentMembers.length; i += 50) {
            var batch = parentMembers.slice(i, i + 50),
                cont = null;
            do {
                var params = {
                    action: "query",
                    prop: "categories",
                    titles: batch.join("|"),
                    cllimit: "max",
                    redirects: "1",
                    formatversion: "2",
                };
                cont && (params.clcontinue = cont);
                var data = await readProgress.request(trApi, params, "Madde kategorileri");
                (data.query &&
                    data.query.pages &&
                    data.query.pages.forEach(function (page) {
                        page.categories &&
                            page.categories.forEach(function (category) {
                                var cleanCategory = category.title.replace(/^Kategori:/i, ""),
                                    subcategory = subcategoryLookup[normalize(cleanCategory)];
                                if (subcategory) {
                                    var key = normalize(page.title);
                                    (matches[key] ||
                                        (matches[key] = {
                                            tr: page.title,
                                            subcategories: [],
                                        }),
                                        -1 === matches[key].subcategories.indexOf(subcategory) &&
                                            matches[key].subcategories.push(subcategory));
                                }
                            });
                    }),
                    (cont = data.continue && data.continue.clcontinue));
            } while (cont);
        }
        return Object.keys(matches).map(function (key) {
            return matches[key];
        });
    }
    // İngilizce maddeleri 50’lik gruplarla Vikiveri ve Türkçe karşılıklarıyla eşleştir.
    async function matchArticlePipeline(titles, missing, button) {
        var result = {},
            seen = new Set();
        function fetch(offset) {
            return (async function (titles, quiet) {
                for (
                    var readProgress = quiet
                            ? {
                                  request: apiRequest,
                              }
                            : createReadProgress(
                                  "Maddeler Vikiveri ile eşleştiriliyor",
                                  titles.length,
                              ),
                        result = {},
                        i = 0;
                    i < titles.length;
                    i += 50
                ) {
                    var batch = titles.slice(i, i + 50),
                        data = await readProgress.request(
                            enApi,
                            {
                                action: "query",
                                prop: "pageprops|info",
                                titles: batch.join("|"),
                                ppprop: "wikibase_item",
                                formatversion: "2",
                            },
                            "İngilizce maddeler",
                        );
                    data.query &&
                        data.query.pages &&
                        data.query.pages.forEach(function (page) {
                            true !== page.redirect &&
                                page.pageprops &&
                                page.pageprops.wikibase_item &&
                                (result[page.title] = page.pageprops.wikibase_item);
                        });
                }
                return result;
            })(titles.slice(offset, offset + 50), true).then(
                function (value) {
                    return {
                        value: value,
                    };
                },
                function (error) {
                    return {
                        error: error,
                    };
                },
            );
        }
        for (
            var pending = titles.length ? fetch(0) : null, offset = 0;
            offset < titles.length;
            offset += 50
        ) {
            var batch = await pending;
            if (batch.error) throw batch.error;
            pending = offset + 50 < titles.length ? fetch(offset + 50) : null;
            var ids = Object.values(batch.value).filter(function (qid) {
                return !seen.has(qid) && (seen.add(qid), true);
            });
            (Object.assign(result, await getTurkishArticles(ids, missing, true)),
                setButtonText(
                    button,
                    "Vikiveri ve Türkçe karşılıklar eşleştiriliyor... " +
                        Math.min(offset + 50, titles.length) +
                        "/" +
                        titles.length,
                ));
        }
        return result;
    }
    async function getTurkishArticles(qids, missingTurkishArticles, quiet) {
        for (
            var readProgress = quiet
                    ? {
                          request: apiRequest,
                      }
                    : createReadProgress("Türkçe madde karşılıkları eşleştiriliyor", qids.length),
                result = {},
                i = 0;
            i < qids.length;
            i += 50
        ) {
            var batch = qids.slice(i, i + 50),
                data = await readProgress.request(
                    wdApi,
                    {
                        action: "wbgetentities",
                        ids: batch.join("|"),
                        props: "sitelinks",
                    },
                    "Vikiveri maddeleri",
                );
            data.entities &&
                Object.keys(data.entities).forEach(function (qid) {
                    var sitelinks,
                        otherProjects,
                        entity = data.entities[qid];
                    (missingTurkishArticles &&
                        entity &&
                        entity.sitelinks &&
                        !entity.sitelinks.trwiki &&
                        entity.sitelinks.enwiki &&
                        missingTurkishArticles.push({
                            qid: qid,
                            en: entity.sitelinks.enwiki.title,
                            languageCount:
                                ((sitelinks = entity.sitelinks),
                                (otherProjects =
                                    /^(commons|species|meta|wikidata|mediawiki|incubator|outreach|foundation|sources|strategy|test|test2|nostalgia|login|office|advisory|quality|usability|donate|exec|collab)wiki$/),
                                Object.keys(sitelinks || {}).filter(function (site) {
                                    return /wiki$/.test(site) && !otherProjects.test(site);
                                }).length),
                        }),
                        entity.sitelinks &&
                            entity.sitelinks.trwiki &&
                            (result[qid] = entity.sitelinks.trwiki.title));
                });
        }
        return result;
    }
    async function getDisambiguationTitles(titles) {
        for (
            var readProgress = createReadProgress(
                    "Anlam ayrımı maddeleri kontrol ediliyor",
                    titles.length,
                ),
                result = {},
                i = 0;
            i < titles.length;
            i += 50
        ) {
            var batch = titles.slice(i, i + 50),
                data = await readProgress.request(
                    trApi,
                    {
                        action: "query",
                        prop: "pageprops",
                        titles: batch.join("|"),
                        ppprop: "disambiguation",
                    },
                    "Anlam ayrımı kontrolü",
                );
            data.query &&
                data.query.pages &&
                Object.keys(data.query.pages).forEach(function (id) {
                    var page = data.query.pages[id];
                    page.pageprops &&
                        void 0 !== page.pageprops.disambiguation &&
                        (result[page.title] = true);
                });
        }
        return result;
    }
    async function getEnglishArticlesForTurkishTitles(titles) {
        for (
            var readProgress = createReadProgress(
                    "İngilizce karşılıklar eşleştiriliyor",
                    titles.length,
                ),
                result = {},
                i = 0;
            i < titles.length;
            i += 50
        ) {
            var batch = titles.slice(i, i + 50),
                data = await readProgress.request(
                    wdApi,
                    {
                        action: "wbgetentities",
                        sites: "trwiki",
                        titles: batch.join("|"),
                        props: "sitelinks",
                        sitefilter: "trwiki|enwiki",
                    },
                    "Vikiveri madde eşleştirmesi",
                );
            data.entities &&
                Object.keys(data.entities).forEach(function (qid) {
                    var entity = data.entities[qid];
                    entity.sitelinks &&
                        entity.sitelinks.trwiki &&
                        entity.sitelinks.enwiki &&
                        (result[normalize(entity.sitelinks.trwiki.title)] =
                            entity.sitelinks.enwiki.title);
                });
        }
        return result;
    }
    // Kategori ekranı: madde taraması ve sonradan tam taramaya geçiş.
    async function findArticleSuggestions(button, full) {
        catCheckScanButton = button;
        var itemId,
            scan = beginScan(button, null, full);
        ((catCheckLastScan = scan),
            (button.disabled = true),
            setButtonText(button, "İngilizce kategori aranıyor..."));
        try {
            var qid = await ((itemId = mw.config.get("wgWikibaseItemId")),
                itemId
                    ? Promise.resolve(itemId)
                    : apiRequest(
                          trApi,
                          {
                              action: "query",
                              prop: "pageprops",
                              titles: pageName,
                              ppprop: "wikibase_item",
                          },
                          "Türkçe kategori",
                      ).then(function (data) {
                          if (!data.query || !data.query.pages)
                              throw new Error("Kategori bilgisi alınamadı.");
                          var ids = Object.keys(data.query.pages);
                          if (!ids.length) throw new Error("Kategori bulunamadı.");
                          var page = data.query.pages[ids[0]];
                          if (!page.pageprops || !page.pageprops.wikibase_item)
                              throw new Error("Bu kategorinin Vikiveri bağlantısı yok.");
                          return page.pageprops.wikibase_item;
                      })),
                englishCategory = await (function (qid) {
                    return apiRequest(
                        wdApi,
                        {
                            action: "wbgetentities",
                            ids: qid,
                            props: "sitelinks",
                        },
                        "Vikiveri",
                    ).then(function (data) {
                        var entity = data.entities[qid];
                        if (!entity || !entity.sitelinks || !entity.sitelinks.enwiki)
                            throw new Error("İngilizce kategori karşılığı bulunamadı.");
                        return entity.sitelinks.enwiki.title;
                    });
                })(qid);
            setButtonText(button, "İngilizce maddeler ve kategoriler alınıyor...");
            var results = await Promise.all([
                    getEnglishMembers(englishCategory),
                    scan.full ? getEnglishSubcategories(englishCategory) : Promise.resolve([]),
                    scan.full ? getEnglishCategories(englishCategory) : Promise.resolve([]),
                ]),
                englishMembers = results[0],
                englishSubcategories = results[1],
                englishParents = results[2];
            if (
                scan.full &&
                !englishMembers.length &&
                !englishSubcategories.length &&
                !englishParents.length
            )
                return void showCategoryPageResults(
                    [],
                    [],
                    [],
                    [],
                    "Eklenecek madde veya alt kategori bulunamadı. Kategori yönetimi için tam aramayı kullanın.",
                );
            setButtonText(button, "Maddeler Vikiveri ile eşleştiriliyor...");
            var missingTurkishArticles = [],
                turkishArticles = await matchArticlePipeline(
                    englishMembers,
                    missingTurkishArticles,
                    button,
                ),
                trTitles = Object.keys(turkishArticles).map(function (qid) {
                    return turkishArticles[qid];
                });
            setButtonText(button, "Anlam ayrımı maddeleri filtreleniyor...");
            var disambiguationTitles = await getDisambiguationTitles(trTitles);
            trTitles = trTitles.filter(function (title) {
                return !disambiguationTitles[title];
            });
            var targetCategory = pageName.replace(/^Kategori:/i, "").trim();
            setButtonText(button, "Mevcut kategori maddeleri kontrol ediliyor...");
            var existingCategoryMemberTitles = await getExistingTurkishCategoryMembers(pageName),
                existingCategoryMembers = {};
            existingCategoryMemberTitles.forEach(function (title) {
                existingCategoryMembers[normalize(title)] = true;
            });
            var wanted = normalize(targetCategory),
                articleSuggestions = [];
            if (
                (trTitles.forEach(function (title) {
                    existingCategoryMembers[normalize(title)] ||
                        (normalize(title) !== wanted &&
                            articleSuggestions.push({
                                tr: title,
                            }));
                }),
                (scan.missingArticles = missingTurkishArticles),
                showScanPreview(
                    scan,
                    "articles",
                    "Kategoriye eklenebilecek maddeler",
                    articleSuggestions,
                ),
                (scan.extend = async function () {
                    var box = document.getElementById(resultId);
                    box && box.classList.remove("catcheck-empty-results");
                    var choices = document.getElementById("catcheck-scope-choices");
                    (choices && ensureResultsPanel().body.prepend(choices),
                        (scan.full = true),
                        Object.keys(scan.statuses).forEach(function (key) {
                            scan.rendered[key] || (scan.statuses[key] = "Sıra bekliyor");
                        }),
                        beginScan(button, scan),
                        (button.disabled = true),
                        (catCheckScanButton = button));
                    try {
                        setButtonText(button, "Kapsam genişletiliyor...");
                        var data = await Promise.all([
                            getEnglishSubcategories(englishCategory),
                            getEnglishCategories(englishCategory),
                            getExistingTurkishCategoryMembers(pageName),
                        ]);
                        ((englishSubcategories = data[0]),
                            (englishParents = data[1]),
                            (existingCategoryMemberTitles = data[2]),
                            (existingCategoryMembers = {}),
                            existingCategoryMemberTitles.forEach(function (title) {
                                existingCategoryMembers[normalize(title)] = true;
                            }),
                            await finishCategoryScan());
                    } catch (error) {
                        var message = makeElement("p");
                        ((message.textContent =
                            "Ek kontroller tamamlanamadı: " + (error.message || String(error))),
                            document.getElementById(resultId).appendChild(message));
                    } finally {
                        (endScan(scan),
                            (catCheckScanButton = null),
                            (button.disabled = false),
                            setButtonText(button, "CatCheck"));
                    }
                }),
                !scan.full)
            ) {
                scan.complete = true;
                var notice = document.querySelector("#" + resultId + " .catcheck-ready-notice");
                if (
                    ((notice.textContent = articleSuggestions.length
                        ? "Madde tarama tamamlandı. Diğer kontrolleri üstteki Tam arama düğmesiyle başlatabilirsiniz."
                        : "Eklenecek madde veya alt kategori bulunamadı. Kategori yönetimi için tam aramayı kullanın."),
                    !articleSuggestions.length)
                ) {
                    document.getElementById(resultId).classList.add("catcheck-empty-results");
                    var choices = document.getElementById("catcheck-scope-choices");
                    choices && notice.after(choices);
                }
                return;
            }
            async function finishCategoryScan() {
                (setScanSection(scan, "categories", "Kontrol ediliyor"),
                    setButtonText(button, "Alt kategoriler kontrol ediliyor..."));
                var subcategoryItems = await getCategoryItems(englishSubcategories),
                    subcategoryQids = [];
                Object.keys(subcategoryItems).forEach(function (category) {
                    var subQid = subcategoryItems[category];
                    -1 === subcategoryQids.indexOf(subQid) && subcategoryQids.push(subQid);
                });
                var turkishSubcategories = await getTurkishCategoryLinks(subcategoryQids),
                    existingTurkishSubcategoryData =
                        await getExistingTurkishSubcategories(pageName),
                    existingTurkishSubcategories = existingTurkishSubcategoryData.lookup,
                    categorySuggestions = [];
                (Object.keys(subcategoryItems).forEach(function (englishSubcategory) {
                    var subQid = subcategoryItems[englishSubcategory],
                        turkishSubcategory = turkishSubcategories[subQid];
                    if (turkishSubcategory) {
                        if (normalize(turkishSubcategory) === wanted) return;
                        if (existingTurkishSubcategories[normalize(turkishSubcategory)]) return;
                        if (
                            categorySuggestions.some(function (item) {
                                return (
                                    item.tr && normalize(item.tr) === normalize(turkishSubcategory)
                                );
                            })
                        )
                            return;
                        categorySuggestions.push({
                            tr: turkishSubcategory,
                            en: englishSubcategory,
                            hasTurkish: true,
                        });
                    } else {
                        if (
                            categorySuggestions.some(function (item) {
                                return item.en === englishSubcategory;
                            })
                        )
                            return;
                        categorySuggestions.push({
                            tr: null,
                            en: englishSubcategory,
                            hasTurkish: false,
                        });
                    }
                }),
                    showScanPreview(scan, "categories", "Alt kategoriler", categorySuggestions),
                    setScanSection(scan, "parents", "Kontrol ediliyor"),
                    setButtonText(button, "Üst kategoriler kontrol ediliyor..."));
                var parentItems = await getCategoryItems(englishParents),
                    parentLinks = await getTurkishCategoryLinks(
                        Object.keys(parentItems).map(function (title) {
                            return parentItems[title];
                        }),
                    ),
                    existingParents = (await getTurkishCategories()).filter(function (name) {
                        return !isIgnoredParentCategory(name);
                    }),
                    existingParentLookup = {};
                existingParents.forEach(function (name) {
                    existingParentLookup[normalize(name)] = true;
                });
                var englishParentLookup = {};
                englishParents.forEach(function (title) {
                    englishParentLookup[normalize(title)] = true;
                });
                var parentSuggestions = [];
                (Object.keys(parentItems).forEach(function (englishParent) {
                    var turkishParent = parentLinks[parentItems[englishParent]];
                    !turkishParent ||
                        isIgnoredParentCategory(turkishParent) ||
                        normalize(turkishParent) === normalize(targetCategory) ||
                        existingParentLookup[normalize(turkishParent)] ||
                        parentSuggestions.some(function (item) {
                            return normalize(item.tr) === normalize(turkishParent);
                        }) ||
                        parentSuggestions.push({
                            tr: turkishParent,
                            action: "add",
                            en: englishParent,
                        });
                }),
                    englishParents.forEach(function (englishParent) {
                        var qid = parentItems[englishParent];
                        (qid && parentLinks[qid]) ||
                            parentSuggestions.push({
                                tr: null,
                                en: englishParent,
                                hasTurkish: false,
                                action: "missing",
                            });
                    }));
                var existingEnglishParents = await getEnglishArticlesForTurkishTitles(
                    existingParents.map(function (name) {
                        return "Kategori:" + name;
                    }),
                );
                (existingParents.forEach(function (name) {
                    var englishTitle = existingEnglishParents[normalize("Kategori:" + name)];
                    englishTitle &&
                        !englishParentLookup[normalize(englishTitle)] &&
                        parentSuggestions.push({
                            tr: name,
                            action: "remove",
                            en: englishTitle,
                        });
                }),
                    showScanPreview(scan, "parents", "Üst kategori önerileri", parentSuggestions));
                var englishToTurkishSubcategory = {};
                Object.keys(subcategoryItems).forEach(function (englishSubcategory) {
                    var subQid = subcategoryItems[englishSubcategory];
                    turkishSubcategories[subQid] &&
                        (englishToTurkishSubcategory[normalize(englishSubcategory)] =
                            turkishSubcategories[subQid]);
                });
                var hasTurkishSubcategories = existingTurkishSubcategoryData.titles.length > 0,
                    moveSuggestions = [];
                if (
                    (setScanSection(scan, "moves", "Kontrol ediliyor"),
                    Object.keys(englishToTurkishSubcategory).length)
                ) {
                    setButtonText(
                        button,
                        "İngilizce alt kategori yerleşimleri kontrol ediliyor...",
                    );
                    var trToEnglish = await getEnglishArticlesForTurkishTitles(
                        existingCategoryMemberTitles,
                    );
                    moveSuggestions = await (async function (
                        trTitles,
                        trToEnglish,
                        englishToTurkishSubcategory,
                    ) {
                        var readProgress = createReadProgress(
                                "Maddelerin alt kategori yerleşimleri kontrol ediliyor",
                                trTitles.length,
                            ),
                            enToTr = {},
                            enTitles = [];
                        trTitles.forEach(function (trTitle) {
                            var enTitle = trToEnglish[normalize(trTitle)];
                            enTitle &&
                                ((enToTr[normalize(enTitle)] = trTitle), enTitles.push(enTitle));
                        });
                        var matches = {},
                            nestedCandidates = {},
                            categoryTitles = {};
                        function addMatch(trTitle, trSubcategory) {
                            var key = normalize(trTitle);
                            (matches[key] ||
                                (matches[key] = {
                                    tr: trTitle,
                                    subcategories: [],
                                }),
                                -1 === matches[key].subcategories.indexOf(trSubcategory) &&
                                    matches[key].subcategories.push(trSubcategory));
                        }
                        for (var i = 0; i < enTitles.length; i += 50) {
                            var batch = enTitles.slice(i, i + 50),
                                cont = null;
                            do {
                                var params = {
                                    action: "query",
                                    prop: "categories",
                                    titles: batch.join("|"),
                                    cllimit: "max",
                                    redirects: "1",
                                    formatversion: "2",
                                };
                                cont &&
                                    ((params.clcontinue = cont.clcontinue),
                                    (params.continue = cont.continue));
                                var data = await readProgress.request(
                                    enApi,
                                    params,
                                    "İngilizce alt kategori üyelikleri",
                                );
                                (data.query &&
                                    data.query.pages &&
                                    data.query.pages.forEach(function (page) {
                                        var trTitle = enToTr[normalize(page.title)];
                                        trTitle &&
                                            page.categories &&
                                            page.categories.forEach(function (category) {
                                                var trSubcategory =
                                                    englishToTurkishSubcategory[
                                                        normalize(category.title)
                                                    ];
                                                if (trSubcategory) addMatch(trTitle, trSubcategory);
                                                else {
                                                    var key = normalize(category.title);
                                                    ((categoryTitles[key] = category.title),
                                                        nestedCandidates[key] ||
                                                            (nestedCandidates[key] = []),
                                                        -1 ===
                                                            nestedCandidates[key].indexOf(
                                                                trTitle,
                                                            ) &&
                                                            nestedCandidates[key].push(trTitle));
                                                }
                                            });
                                    }),
                                    (cont = data.continue || null));
                            } while (cont);
                        }
                        for (
                            var nestedTitles = Object.keys(categoryTitles).map(function (key) {
                                    return categoryTitles[key];
                                }),
                                j = 0;
                            j < nestedTitles.length;
                            j += 50
                        ) {
                            var parents = nestedTitles.slice(j, j + 50),
                                continuation = null;
                            do {
                                var parentParams = {
                                    action: "query",
                                    prop: "categories",
                                    titles: parents.join("|"),
                                    cllimit: "max",
                                    formatversion: "2",
                                };
                                continuation &&
                                    ((parentParams.clcontinue = continuation.clcontinue),
                                    (parentParams.continue = continuation.continue));
                                var parentData = await readProgress.request(
                                    enApi,
                                    parentParams,
                                    "Alt kategorilerin üst kategorileri",
                                );
                                (parentData.query &&
                                    parentData.query.pages &&
                                    parentData.query.pages.forEach(function (page) {
                                        var articles =
                                            nestedCandidates[normalize(page.title)] || [];
                                        (page.categories || []).forEach(function (parent) {
                                            var target =
                                                englishToTurkishSubcategory[
                                                    normalize(parent.title)
                                                ];
                                            target &&
                                                articles.forEach(function (trTitle) {
                                                    addMatch(trTitle, target);
                                                });
                                        });
                                    }),
                                    (continuation = parentData.continue || null));
                            } while (continuation);
                        }
                        return Object.keys(matches).map(function (key) {
                            return matches[key];
                        });
                    })(existingCategoryMemberTitles, trToEnglish, englishToTurkishSubcategory);
                }
                (setScanSection(scan, "moves", "Sonuçlar hazırlanıyor"),
                    setScanSection(scan, "submoves", "Kontrol ediliyor"),
                    hasTurkishSubcategories &&
                        setButtonText(
                            button,
                            "Alt kategorilerin taşınabileceği kategoriler kontrol ediliyor...",
                        ));
                var subcategoryMoves = hasTurkishSubcategories
                    ? await (async function (titles) {
                          var readProgress = createReadProgress(
                                  "Alt kategori yerleşimleri kontrol ediliyor",
                                  titles.length,
                              ),
                              mapping = await getEnglishArticlesForTurkishTitles(titles),
                              enToTr = {},
                              directTrLookup = {},
                              enTitles = [];
                          titles.forEach(function (title) {
                              directTrLookup[normalize(title)] = true;
                              var en = mapping[normalize(title)];
                              en &&
                                  ((enToTr[normalize(en)] = title.replace(/^Kategori:/i, "")),
                                  enTitles.push(en));
                          });
                          var suggestions = {},
                              nestedEnglishParents = {};
                          function addSuggestion(child, target) {
                              if (target && normalize(target) !== normalize(child)) {
                                  var key = normalize(child);
                                  (suggestions[key] ||
                                      (suggestions[key] = {
                                          tr: child,
                                          subcategories: [],
                                      }),
                                      -1 === suggestions[key].subcategories.indexOf(target) &&
                                          suggestions[key].subcategories.push(target));
                              }
                          }
                          for (var i = 0; i < enTitles.length; i += 50) {
                              var batch = enTitles.slice(i, i + 50),
                                  continuation = null;
                              do {
                                  var params = {
                                      action: "query",
                                      prop: "categories",
                                      titles: batch.join("|"),
                                      cllimit: "max",
                                      formatversion: "2",
                                  };
                                  continuation &&
                                      ((params.clcontinue = continuation.clcontinue),
                                      (params.continue = continuation.continue));
                                  var data = await readProgress.request(
                                      enApi,
                                      params,
                                      "Alt kategorilerin İngilizce üst kategorileri",
                                  );
                                  (data.query &&
                                      data.query.pages &&
                                      data.query.pages.forEach(function (page) {
                                          var child = enToTr[normalize(page.title)];
                                          child &&
                                              (page.categories || []).forEach(function (parent) {
                                                  var target = enToTr[normalize(parent.title)];
                                                  if (target) addSuggestion(child, target);
                                                  else {
                                                      var key = normalize(parent.title);
                                                      (nestedEnglishParents[key] ||
                                                          (nestedEnglishParents[key] = {
                                                              title: parent.title,
                                                              children: [],
                                                          }),
                                                          -1 ===
                                                              nestedEnglishParents[
                                                                  key
                                                              ].children.indexOf(child) &&
                                                              nestedEnglishParents[
                                                                  key
                                                              ].children.push(child));
                                                  }
                                              });
                                      }),
                                      (continuation = data.continue || null));
                              } while (continuation);
                          }
                          var nestedTitles = Object.keys(nestedEnglishParents).map(function (key) {
                                  return nestedEnglishParents[key].title;
                              }),
                              nestedItems = await getCategoryItems(nestedTitles),
                              nestedLinks = await getTurkishCategoryLinks(
                                  Array.from(
                                      new Set(
                                          Object.keys(nestedItems).map(function (title) {
                                              return nestedItems[title];
                                          }),
                                      ),
                                  ),
                              ),
                              trTargets = {};
                          Object.keys(nestedItems).forEach(function (en) {
                              var tr = nestedLinks[nestedItems[en]];
                              tr &&
                                  !enToTr[normalize(en)] &&
                                  (trTargets[normalize("Kategori:" + tr)] = {
                                      title: "Kategori:" + tr,
                                      children: nestedEnglishParents[normalize(en)].children,
                                  });
                          });
                          for (
                              var targetTitles = Object.keys(trTargets).map(function (key) {
                                      return trTargets[key].title;
                                  }),
                                  j = 0;
                              j < targetTitles.length;
                              j += 50
                          ) {
                              var targetBatch = targetTitles.slice(j, j + 50),
                                  trContinuation = null;
                              do {
                                  var trParams = {
                                      action: "query",
                                      prop: "categories",
                                      titles: targetBatch.join("|"),
                                      cllimit: "max",
                                      formatversion: "2",
                                  };
                                  trContinuation &&
                                      ((trParams.clcontinue = trContinuation.clcontinue),
                                      (trParams.continue = trContinuation.continue));
                                  var trData = await readProgress.request(
                                      trApi,
                                      trParams,
                                      "İkinci seviye alt kategoriler",
                                  );
                                  (trData.query &&
                                      trData.query.pages &&
                                      trData.query.pages.forEach(function (page) {
                                          var candidate = trTargets[normalize(page.title)];
                                          if (candidate) {
                                              var target = page.title.replace(/^Kategori:/i, ""),
                                                  directParents = (page.categories || []).map(
                                                      function (parent) {
                                                          return normalize(parent.title);
                                                      },
                                                  );
                                              candidate.children.forEach(function (child) {
                                                  directParents.some(function (parent) {
                                                      return (
                                                          !!directTrLookup[parent] &&
                                                          parent !== normalize("Kategori:" + child)
                                                      );
                                                  }) && addSuggestion(child, target);
                                              });
                                          }
                                      }),
                                      (trContinuation = trData.continue || null));
                              } while (trContinuation);
                          }
                          return Object.keys(suggestions).map(function (key) {
                              return suggestions[key];
                          });
                      })(existingTurkishSubcategoryData.titles)
                    : [];
                (setScanSection(scan, "submoves", "Sonuçlar hazırlanıyor"),
                    setScanSection(scan, "redundantSubs", "Kontrol ediliyor"),
                    hasTurkishSubcategories &&
                        setButtonText(
                            button,
                            "Alt kategorilerin yinelenen üyelikleri kontrol ediliyor...",
                        ));
                var redundantSubcategories = (
                        hasTurkishSubcategories
                            ? await findMembersAlsoInSubcategories(
                                  existingTurkishSubcategoryData.titles,
                                  existingTurkishSubcategoryData.titles,
                              )
                            : []
                    )
                        .map(function (item) {
                            return {
                                tr: item.tr.replace(/^Kategori:/i, ""),
                                subcategories: item.subcategories.filter(function (name) {
                                    return (
                                        normalize(name) !==
                                        normalize(item.tr.replace(/^Kategori:/i, ""))
                                    );
                                }),
                            };
                        })
                        .filter(function (item) {
                            return item.subcategories.length > 0;
                        }),
                    redundantSubLookup = {};
                (redundantSubcategories.forEach(function (item) {
                    redundantSubLookup[normalize(item.tr)] = true;
                }),
                    (subcategoryMoves = subcategoryMoves.filter(function (item) {
                        return !redundantSubLookup[normalize(item.tr)];
                    })),
                    setScanSection(scan, "redundantSubs", "Sonuçlar hazırlanıyor"),
                    setScanSection(scan, "redundantArticles", "Kontrol ediliyor"),
                    hasTurkishSubcategories &&
                        setButtonText(button, "Alt kategori üyelikleri kontrol ediliyor..."));
                var titlesToCheckInSubcategories = existingCategoryMemberTitles,
                    subcategoriesToCheck = existingTurkishSubcategoryData.titles.slice(),
                    subcategoriesToCheckLookup = {};
                (subcategoriesToCheck.forEach(function (title) {
                    subcategoriesToCheckLookup[normalize(title)] = true;
                }),
                    Object.keys(turkishSubcategories).forEach(function (qid) {
                        var title = "Kategori:" + turkishSubcategories[qid];
                        subcategoriesToCheckLookup[normalize(title)] ||
                            (subcategoriesToCheck.push(title),
                            (subcategoriesToCheckLookup[normalize(title)] = true));
                    }));
                var membersFoundInSubcategories = hasTurkishSubcategories
                        ? await findMembersAlsoInSubcategories(
                              titlesToCheckInSubcategories,
                              existingTurkishSubcategoryData.titles,
                          )
                        : [],
                    subcategoryMemberLookup = {},
                    existingSubcategoriesByArticle = {};
                membersFoundInSubcategories.forEach(function (item) {
                    ((subcategoryMemberLookup[normalize(item.tr)] = true),
                        (existingSubcategoriesByArticle[normalize(item.tr)] = item.subcategories));
                });
                var redundantParentMembers = membersFoundInSubcategories.filter(function (item) {
                    return existingCategoryMembers[normalize(item.tr)];
                });
                moveSuggestions = moveSuggestions
                    .map(function (item) {
                        var existingSubs = existingSubcategoriesByArticle[normalize(item.tr)] || [];
                        return {
                            tr: item.tr,
                            subcategories: item.subcategories.filter(function (subcategory) {
                                return -1 === existingSubs.indexOf(subcategory);
                            }),
                        };
                    })
                    .filter(function (item) {
                        return item.subcategories.length > 0;
                    });
                var movingLookup = {};
                (moveSuggestions.forEach(function (item) {
                    movingLookup[normalize(item.tr)] = true;
                }),
                    (redundantParentMembers = redundantParentMembers.filter(function (item) {
                        return !movingLookup[normalize(item.tr)];
                    })),
                    showCategoryPageResults(
                        articleSuggestions,
                        categorySuggestions,
                        moveSuggestions,
                        redundantParentMembers,
                        null,
                        parentSuggestions,
                        subcategoryMoves,
                        redundantSubcategories,
                        missingTurkishArticles,
                        subcategoriesToCheck,
                        scan,
                        true,
                    ));
            }
            await finishCategoryScan();
        } catch (error) {
            if ((console.error("[Kategori aracı]", error), Object.keys(scan.sections).length)) {
                var message = makeElement("p");
                ((message.textContent =
                    "Tarama tamamlanamadı; hazır sonuçlar korunuyor. " +
                    (error.message || String(error))),
                    document.getElementById(resultId).appendChild(message));
            } else
                showCategoryPageResults(
                    [],
                    [],
                    [],
                    [],
                    "Hata oluştu: " + (error.message || String(error)),
                );
        } finally {
            (endScan(scan),
                catCheckScanButton === button && (catCheckScanButton = null),
                (button.disabled = false),
                setButtonText(button, "CatCheck"));
        }
    }
    function addResultVersion(heading) {
        heading.appendChild(makeText(" — v4.2 · "));
        var feedback = makeElement("a");
        ((feedback.href = mw.util.getUrl("Kullanıcı mesaj:İmmortalance/js/CatCheck.js")),
            (feedback.textContent = "Geri bildirim"),
            (feedback.target = "_blank"),
            (feedback.rel = "noopener"),
            feedback.addEventListener("click", function (event) {
                event.stopPropagation();
            }),
            heading.appendChild(feedback));
    }
    // Kategori ekranının sonuç bölümleri ve seçim düğmeleri.
    function showCategoryPageResults(
        articles,
        categories,
        moveSuggestions,
        redundantArticles,
        error,
        parentSuggestions,
        subcategoryMoves,
        redundantSubcategories,
        missingTurkishArticles,
        articleSubcategoriesToCheck,
        scan,
        complete,
    ) {
        ((categories = categories.map(function (item) {
            return Object.assign({}, item);
        })),
            (parentSuggestions = (parentSuggestions || []).map(function (item) {
                return Object.assign({}, item);
            })));
        var old = document.getElementById(resultId);
        old && !scan && old.remove();
        var box = makeElement("div");
        ((box.id = resultId), box.classList.add("ccs1", "ccs2", "ccs3", "ccs4", "ccs5"));
        var heading = makeElement("strong");
        if (
            ((heading.textContent = "Kategori kontrol sonuçları"),
            addResultVersion(heading),
            box.appendChild(heading),
            error)
        ) {
            var errorBox = makeElement("div");
            return (
                errorBox.classList.add("ccs6", "ccs7"),
                (errorBox.textContent = error),
                box.appendChild(errorBox),
                insertResultsBox(box),
                void ensureSubcategoryArticleSuggestions(box)
            );
        }
        var allControls = makeElement("div");
        allControls.classList.add("ccs8", "ccs9", "ccs10", "ccs11");
        var selectEverythingLabel = makeElement("label");
        selectEverythingLabel.classList.add("ccs12", "ccs13");
        var selectEverything = makeElement("input");
        ((selectEverything.type = "checkbox"),
            selectEverythingLabel.appendChild(selectEverything),
            selectEverythingLabel.appendChild(makeText(" Tüm maddeleri ve alt kategorileri seç")),
            allControls.appendChild(selectEverythingLabel));
        var addEverythingButton = makeElement("button");
        ((addEverythingButton.type = "button"),
            setButtonText(addEverythingButton, "Seçilenlerin hepsini ekle"),
            addEverythingButton.classList.add("ccs14", "ccs13"),
            allControls.appendChild(addEverythingButton),
            box.appendChild(allControls));
        var articleCheckboxes = [],
            categoryCheckboxes = [],
            articleSelectAll = null,
            categorySelectAll = null,
            articleHeading = makeElement("div");
        (articleHeading.classList.add("ccs15", "ccs16", "ccs17"),
            (articleHeading.textContent =
                "Kategoriye eklenebilecek maddeler (" + articles.length + ")"));
        var articleTitleNode = articleHeading.firstChild;
        (box.appendChild(articleHeading), (missingTurkishArticles = missingTurkishArticles || []));
        var missingArticleControls = makeElement("div");
        missingArticleControls.classList.add("ccs18");
        var missingArticleButton = makeElement("button");
        ((missingArticleButton.type = "button"),
            setButtonText(
                missingArticleButton,
                "Türkçede olmayan, en çok dil bağlantılı 5 maddeyi göster",
            ),
            missingArticleControls.appendChild(missingArticleButton),
            box.appendChild(missingArticleControls));
        var missingArticleResults = makeElement("div");
        if (
            (missingArticleResults.classList.add("ccs19"),
            box.appendChild(missingArticleResults),
            missingArticleButton.addEventListener("click", function () {
                missingArticleResults.textContent = "";
                var top = missingTurkishArticles
                        .slice()
                        .sort(function (a, b) {
                            return (
                                b.languageCount - a.languageCount || a.en.localeCompare(b.en, "en")
                            );
                        })
                        .slice(0, 5),
                    note = makeElement("div");
                if (
                    ((note.textContent =
                        "İngilizce kategoride Türkçe dil bağlantısı olmayan " +
                        missingTurkishArticles.length.toLocaleString("tr-TR") +
                        " madde arasından en çok dil bağlantısına sahip " +
                        top.length +
                        " madde:"),
                    missingArticleResults.appendChild(note),
                    top.length)
                ) {
                    var rankedList = makeElement("ol");
                    (top.forEach(function (item) {
                        var row = makeElement("li"),
                            link = makeElement("a");
                        ((link.href =
                            "https://en.wikipedia.org/wiki/" +
                            encodeURIComponent(item.en.replace(/ /g, "_"))),
                            (link.textContent = item.en),
                            (link.target = "_blank"),
                            (link.rel = "noopener"),
                            row.appendChild(link),
                            row.appendChild(
                                makeText(
                                    " (" + item.languageCount.toLocaleString("tr-TR") + " dil)",
                                ),
                            ),
                            rankedList.appendChild(row));
                    }),
                        missingArticleResults.appendChild(rankedList));
                } else
                    note.textContent =
                        "İngilizce kategoride Türkçe dil bağlantısı olmayan madde bulunamadı.";
                (markCompleted(missingArticleButton),
                    setButtonText(
                        missingArticleButton,
                        "✓ Türkçede olmayan ilk " + top.length + " madde gösterildi",
                    ));
            }),
            articles.length)
        ) {
            var articleControls = makeElement("div");
            (articleControls.classList.add("ccs20"),
                ((articleSelectAll = makeElement("input")).type = "checkbox"),
                articleControls.appendChild(articleSelectAll),
                articleControls.appendChild(makeText(" Tümünü seç ")));
            var articleAddButton = makeElement("button");
            ((articleAddButton.type = "button"),
                setButtonText(articleAddButton, "Seçilen maddeleri kategoriye ekle"),
                articleAddButton.classList.add("ccs14", "ccs13"),
                articleControls.appendChild(articleAddButton));
            var filterSubcategoryButton = makeElement("button");
            ((filterSubcategoryButton.type = "button"),
                filterSubcategoryButton.classList.add("ccs21"),
                setButtonText(filterSubcategoryButton, "Alt kategorilerde mevcut olanları çıkar"),
                articleControls.appendChild(filterSubcategoryButton));
            var filterSubcategoryStatus = makeElement("span");
            (filterSubcategoryStatus.classList.add("ccs21"),
                articleControls.appendChild(filterSubcategoryStatus),
                filterSubcategoryButton.addEventListener("click", async function () {
                    filterSubcategoryButton.disabled = true;
                    var addWasDisabled = articleAddButton.disabled,
                        allWasDisabled = addEverythingButton.disabled;
                    ((articleAddButton.disabled = true),
                        (addEverythingButton.disabled = true),
                        resetActionButton(filterSubcategoryButton),
                        setButtonText(
                            filterSubcategoryButton,
                            "Alt kategori üyelikleri kontrol ediliyor...",
                        ),
                        (filterSubcategoryStatus.textContent = ""));
                    try {
                        var titles = articleCheckboxes.map(function (checkbox) {
                            return checkbox.value;
                        });
                        articleSubcategoriesToCheck ||
                            (articleSubcategoriesToCheck = (
                                await getExistingTurkishSubcategories(pageName)
                            ).titles);
                        var matches = await findMembersAlsoInSubcategories(
                                titles,
                                articleSubcategoriesToCheck,
                                filterSubcategoryButton,
                            ),
                            excluded = {};
                        matches.forEach(function (item) {
                            excluded[normalize(item.tr)] = true;
                        });
                        var removed = 0;
                        ((articleCheckboxes = articleCheckboxes.filter(function (checkbox) {
                            return (
                                !excluded[normalize(checkbox.value)] ||
                                ((checkbox.checked = false),
                                checkbox.parentNode.remove(),
                                removed++,
                                false)
                            );
                        })),
                            (articles = articles.filter(function (item) {
                                return !excluded[normalize(item.tr)];
                            })),
                            (articleTitleNode.nodeValue =
                                "Kategoriye eklenebilecek maddeler (" +
                                articleCheckboxes.length +
                                ")"),
                            (articleSelectAll.checked =
                                articleCheckboxes.length > 0 &&
                                articleCheckboxes.every(function (checkbox) {
                                    return checkbox.checked;
                                })),
                            (articleSelectAll.indeterminate =
                                articleCheckboxes.some(function (checkbox) {
                                    return checkbox.checked;
                                }) && !articleSelectAll.checked),
                            updateMasterSelection(),
                            (filterSubcategoryStatus.textContent =
                                removed + " madde öneri listesinden çıkarıldı."),
                            (articleSubcategoriesToCheck || []).length ||
                                (filterSubcategoryStatus.textContent =
                                    "Kontrol edilecek Türkçe alt kategori bulunmuyor."),
                            markCompleted(filterSubcategoryButton),
                            setButtonText(
                                filterSubcategoryButton,
                                "✓ Alt kategori kontrolü tamamlandı",
                            ));
                    } catch (error) {
                        ((filterSubcategoryStatus.textContent =
                            "Kontrol tamamlanamadı; öneri listesi korunuyor. " +
                            (error.message || String(error))),
                            setButtonText(
                                filterSubcategoryButton,
                                "Alt kategori kontrolünü tekrar dene",
                            ));
                    } finally {
                        ((filterSubcategoryButton.disabled = false),
                            (articleAddButton.disabled = addWasDisabled),
                            (addEverythingButton.disabled = allWasDisabled));
                    }
                }),
                box.appendChild(articleControls));
            var articleList = makeElement("div");
            (articleList.classList.add("catcheck-list", "ccs22"),
                articles.forEach(function (item) {
                    var row = makeElement("span");
                    row.classList.add("ccs23", "ccs24", "ccs25");
                    var checkbox = makeElement("input");
                    ((checkbox.type = "checkbox"),
                        (checkbox.value = item.tr),
                        articleCheckboxes.push(checkbox),
                        row.appendChild(checkbox));
                    var link = makeElement("a");
                    ((link.href = mw.util.getUrl(item.tr)),
                        (link.textContent = " " + item.tr),
                        (link.target = "_blank"),
                        row.appendChild(link),
                        articleList.appendChild(row));
                }),
                box.appendChild(articleList),
                articleSelectAll.addEventListener("change", function () {
                    (articleCheckboxes.forEach(function (checkbox) {
                        checkbox.checked = !checkbox.disabled && articleSelectAll.checked;
                    }),
                        updateMasterSelection());
                }),
                articleAddButton.addEventListener("click", function () {
                    var selected = [];
                    (articleCheckboxes.forEach(function (checkbox) {
                        checkbox.checked && !checkbox.disabled && selected.push(checkbox.value);
                    }),
                        selected.length
                            ? addCategoryToArticles(selected, articleAddButton)
                            : alert("Önce en az bir madde seç."));
                }));
        } else {
            var noArticles = makeElement("div");
            ((noArticles.textContent = "Eklenecek yeni madde bulunamadı."),
                noArticles.classList.add("ccs26"),
                box.appendChild(noArticles));
        }
        var categoryHeading = makeElement("div");
        if (
            (categoryHeading.classList.add("ccs27", "ccs16", "ccs17"),
            (categoryHeading.textContent = "Alt kategoriler (" + categories.length + ")"),
            box.appendChild(categoryHeading),
            categories.length)
        ) {
            var categoryControls = makeElement("div");
            (categoryControls.classList.add("ccs20"),
                ((categorySelectAll = makeElement("input")).type = "checkbox"),
                categoryControls.appendChild(categorySelectAll),
                categoryControls.appendChild(makeText(" Tüm Türkçe kategorileri seç ")));
            var categoryAddButton = makeElement("button");
            ((categoryAddButton.type = "button"),
                setButtonText(categoryAddButton, "Seçilen alt kategorileri ekle"),
                categoryAddButton.classList.add("ccs14", "ccs13"),
                categoryControls.appendChild(categoryAddButton),
                addMemberCountControls(categories, categoryControls),
                box.appendChild(categoryControls));
            var categoryList = makeElement("div");
            (categoryList.classList.add("catcheck-list", "ccs22"),
                categories.forEach(function (item) {
                    var row = makeElement("span");
                    if ((row.classList.add("ccs23", "ccs24", "ccs25"), item.hasTurkish)) {
                        var checkbox = makeElement("input");
                        ((checkbox.type = "checkbox"),
                            (checkbox.value = item.tr),
                            categoryCheckboxes.push(checkbox),
                            row.appendChild(checkbox));
                        var link = makeElement("a");
                        ((link.href = mw.util.getUrl("Kategori:" + item.tr)),
                            (link.textContent = " " + item.tr),
                            (link.target = "_blank"),
                            row.appendChild(link));
                    } else {
                        var enLink = makeElement("a"),
                            cleanEn = item.en.replace(/^Category:/i, "");
                        ((enLink.href =
                            "https://en.wikipedia.org/wiki/Category:" +
                            encodeURIComponent(cleanEn.replace(/ /g, "_"))),
                            (enLink.textContent = "[EN] " + cleanEn),
                            (enLink.target = "_blank"),
                            (enLink.rel = "noopener"),
                            enLink.classList.add("ccs28"),
                            (enLink.title = "Türkçe karşılığı bulunamadı. İngilizce kategoriyi aç"),
                            row.appendChild(enLink),
                            (item.memberCountNode = makeElement("span")));
                        var savedMemberCount = loadMemberCountProgress()[normalize(item.en)];
                        (savedMemberCount &&
                            true === savedMemberCount.done &&
                            ((item.memberCountNode.textContent =
                                " (" +
                                savedMemberCount.articles.toLocaleString("tr-TR") +
                                "m " +
                                savedMemberCount.categories.toLocaleString("tr-TR") +
                                "k)"),
                            (item.memberCountNode.title = "Önceki sayımdan yüklendi")),
                            row.appendChild(item.memberCountNode));
                    }
                    categoryList.appendChild(row);
                }),
                box.appendChild(categoryList),
                categorySelectAll.addEventListener("change", function () {
                    (categoryCheckboxes.forEach(function (checkbox) {
                        checkbox.checked = !checkbox.disabled && categorySelectAll.checked;
                    }),
                        updateMasterSelection());
                }),
                categoryAddButton.addEventListener("click", function () {
                    var selected = [];
                    (categoryCheckboxes.forEach(function (checkbox) {
                        checkbox.checked && !checkbox.disabled && selected.push(checkbox.value);
                    }),
                        selected.length
                            ? addCategoriesToCategory(selected, categoryAddButton)
                            : alert("Önce en az bir alt kategori seç."));
                }));
        } else {
            var noCategories = makeElement("div");
            ((noCategories.textContent = "İngilizce kategoride alt kategori bulunamadı."),
                box.appendChild(noCategories));
        }
        function updateMasterSelection() {
            var allCheckboxes = articleCheckboxes.concat(categoryCheckboxes),
                selectedCount = allCheckboxes.filter(function (checkbox) {
                    return checkbox.checked;
                }).length;
            ((selectEverything.checked =
                allCheckboxes.length > 0 && selectedCount === allCheckboxes.length),
                (selectEverything.indeterminate =
                    selectedCount > 0 && selectedCount < allCheckboxes.length));
        }
        (articleCheckboxes.concat(categoryCheckboxes).forEach(function (checkbox) {
            checkbox.addEventListener("change", updateMasterSelection);
        }),
            selectEverything.addEventListener("change", function () {
                (articleCheckboxes.concat(categoryCheckboxes).forEach(function (checkbox) {
                    checkbox.checked = selectEverything.checked;
                }),
                    articleSelectAll && (articleSelectAll.checked = selectEverything.checked),
                    categorySelectAll && (categorySelectAll.checked = selectEverything.checked),
                    (selectEverything.indeterminate = false));
            }),
            addEverythingButton.addEventListener("click", function () {
                var selectedArticles = [],
                    selectedCategories = [];
                (articleCheckboxes.forEach(function (checkbox) {
                    checkbox.checked && !checkbox.disabled && selectedArticles.push(checkbox.value);
                }),
                    categoryCheckboxes.forEach(function (checkbox) {
                        checkbox.checked &&
                            !checkbox.disabled &&
                            selectedCategories.push(checkbox.value);
                    }),
                    selectedArticles.length || selectedCategories.length
                        ? addAllSelected(selectedArticles, selectedCategories, addEverythingButton)
                        : alert("Önce en az bir madde veya alt kategori seç."));
            }),
            (parentSuggestions = (parentSuggestions || []).filter(function (item) {
                return !item.tr || !isIgnoredParentCategory(item.tr);
            })).forEach(function (item) {
                item.hasTurkish = !!item.tr;
            }));
        var parentHeading = makeElement("div");
        if (
            (parentHeading.classList.add("ccs29", "ccs17"),
            (parentHeading.textContent =
                "Üst kategori önerileri (" + parentSuggestions.length + ")"),
            box.appendChild(parentHeading),
            parentSuggestions.length)
        ) {
            var parentControls = makeElement("div");
            parentControls.classList.add("ccs20");
            var parentSelectAll = makeElement("input");
            ((parentSelectAll.type = "checkbox"),
                parentControls.appendChild(parentSelectAll),
                parentControls.appendChild(makeText(" Tümünü seç ")));
            var parentButton = makeElement("button");
            ((parentButton.type = "button"),
                setButtonText(parentButton, "Seçilen üst kategorileri düzenle"),
                parentButton.classList.add("ccs14", "ccs13"),
                parentControls.appendChild(parentButton),
                addMemberCountControls(parentSuggestions, parentControls),
                box.appendChild(parentControls));
            var parentCheckboxes = [];
            (parentSuggestions.forEach(function (item) {
                var row = makeElement("div");
                if ((row.classList.add("ccs22"), !item.hasTurkish)) {
                    var englishLink = makeElement("a");
                    ((englishLink.href =
                        "https://en.wikipedia.org/wiki/" +
                        encodeURIComponent(item.en.replace(/ /g, "_"))),
                        (englishLink.textContent = "[EN] " + item.en.replace(/^Category:/i, "")),
                        (englishLink.target = "_blank"),
                        (englishLink.rel = "noopener"),
                        row.appendChild(englishLink),
                        (item.memberCountNode = makeElement("span")));
                    var savedCount = loadMemberCountProgress()[normalize(item.en)];
                    return (
                        savedCount &&
                            true === savedCount.done &&
                            ((item.memberCountNode.textContent =
                                " (" +
                                savedCount.articles.toLocaleString("tr-TR") +
                                "m " +
                                savedCount.categories.toLocaleString("tr-TR") +
                                "k)"),
                            (item.memberCountNode.title = "Önceki sayımdan yüklendi")),
                        row.appendChild(item.memberCountNode),
                        void box.appendChild(row)
                    );
                }
                var checkbox = makeElement("input");
                ((checkbox.type = "checkbox"),
                    (checkbox.parentInfo = item),
                    parentCheckboxes.push(checkbox),
                    row.appendChild(checkbox),
                    row.appendChild(
                        makeText("add" === item.action ? " Ekle: " : " Gözden geçir ve kaldır: "),
                    ));
                var link = makeElement("a");
                ((link.href = mw.util.getUrl("Kategori:" + item.tr)),
                    (link.textContent = item.tr),
                    (link.target = "_blank"),
                    row.appendChild(link),
                    row.appendChild(
                        makeText(
                            "add" === item.action
                                ? " (İngilizce üst kategori: " + item.en + ")"
                                : " (İngilizce karşılığı üst kategori listesinde yok: " +
                                      item.en +
                                      ")",
                        ),
                    ),
                    box.appendChild(row));
            }),
                parentSelectAll.addEventListener("change", function () {
                    parentCheckboxes.forEach(function (checkbox) {
                        checkbox.checked = parentSelectAll.checked;
                    });
                }),
                parentButton.addEventListener("click", function () {
                    var selected = parentCheckboxes
                        .filter(function (checkbox) {
                            return checkbox.checked;
                        })
                        .map(function (checkbox) {
                            return checkbox.parentInfo;
                        });
                    selected.length
                        ? (function (selected, button) {
                              ((button.disabled = true),
                                  resetActionButton(button),
                                  setButtonText(button, "Üst kategoriler düzenleniyor..."),
                                  setGroupProgress(button, 0, selected.length),
                                  getPageContent(pageName)
                                      .then(function (content) {
                                          var updated = content,
                                              added = [],
                                              removed = [];
                                          if (
                                              (selected.forEach(function (item) {
                                                  var category = item.tr.replace(/_/g, " ").trim(),
                                                      pattern = category
                                                          .split(/\s+/)
                                                          .map(escapeRegExp)
                                                          .join("[ _]+"),
                                                      linkPattern = new RegExp(
                                                          "^[ \\t]*\\[\\[[ \\t]*" +
                                                              escapeRegExp("Kategori:") +
                                                              "[ \\t]*" +
                                                              pattern +
                                                              "[ \\t]*(?:\\|[^\\]\\r\\n]*)?\\]\\][ \\t]*(?:\\r?\\n|$)",
                                                          "gim",
                                                      );
                                                  if ("remove" === item.action) {
                                                      var next = updated.replace(linkPattern, "");
                                                      next !== updated &&
                                                          ((updated = next),
                                                          removed.push(category));
                                                  } else
                                                      linkPattern.test(updated) ||
                                                          added.push(category);
                                              }),
                                              (updated = appendCategoryLinks(
                                                  updated,
                                                  added.map(function (name) {
                                                      return "[\u005bKategori:" + name + "]]";
                                                  }),
                                              )) === content)
                                          )
                                              return (
                                                  markCompleted(button),
                                                  setGroupProgress(
                                                      button,
                                                      selected.length,
                                                      selected.length,
                                                  ),
                                                  null
                                              );
                                          var summary = [];
                                          return (
                                              added.length &&
                                                  summary.push(
                                                      "Üst kategori eklendi: " +
                                                          added
                                                              .map(function (name) {
                                                                  return (
                                                                      "[\u005bKategori:" + name + "]]"
                                                                  );
                                                              })
                                                              .join(", "),
                                                  ),
                                              removed.length &&
                                                  summary.push(
                                                      "Üst kategori kaldırıldı: " +
                                                          removed
                                                              .map(function (name) {
                                                                  return (
                                                                      "[\u005bKategori:" + name + "]]"
                                                                  );
                                                              })
                                                              .join(", "),
                                                  ),
                                              trApiPost({
                                                  action: "edit",
                                                  title: pageName,
                                                  text: updated,
                                                  summary:
                                                      summary.join("; ") +
                                                      " ([[Kullanıcı:İmmortalance/js/CatCheck.js|''CatCheck v4.2'']])",
                                                  minor: true,
                                              })
                                          );
                                      })
                                      .then(function (data) {
                                          if (
                                              data &&
                                              (!data.edit || "Success" !== data.edit.result)
                                          )
                                              throw new Error(
                                                  (data.error && data.error.info) ||
                                                      "Değişiklik kaydedilemedi.",
                                              );
                                          (markCompleted(button),
                                              setGroupProgress(
                                                  button,
                                                  selected.length,
                                                  selected.length,
                                              ));
                                      })
                                      .catch(function (error) {
                                          ((button.disabled = false),
                                              setButtonText(
                                                  button,
                                                  "Seçilen üst kategorileri düzenle",
                                              ),
                                              alert("Hata: " + (error.message || error)));
                                      }));
                          })(selected, parentButton)
                        : alert("Önce en az bir üst kategori seç.");
                }));
        } else {
            var noParents = makeElement("div");
            ((noParents.textContent = "Üst kategori önerisi bulunamadı."),
                box.appendChild(noParents));
        }
        var moveHeading = makeElement("div");
        if (
            (moveHeading.classList.add("ccs27", "ccs16", "ccs17"),
            (moveHeading.textContent =
                "Alt kategorilere taşınabilecek maddeler (" + moveSuggestions.length + ")"),
            box.appendChild(moveHeading),
            moveSuggestions.length)
        ) {
            var moveControls = makeElement("div");
            moveControls.classList.add("ccs20");
            var moveSelectAll = makeElement("input");
            ((moveSelectAll.type = "checkbox"),
                moveControls.appendChild(moveSelectAll),
                moveControls.appendChild(makeText(" Tümünü seç ")));
            var moveButton = makeElement("button");
            ((moveButton.type = "button"),
                setButtonText(moveButton, "Seçilenleri alt kategorilere taşı"),
                moveButton.classList.add("ccs14", "ccs13"),
                moveControls.appendChild(moveButton),
                box.appendChild(moveControls));
            var moveList = makeElement("div");
            moveList.classList.add("catcheck-list", "ccs22");
            var moveCheckboxes = [];
            (moveSuggestions.forEach(function (item) {
                var row = makeElement("div"),
                    checkbox = makeElement("input");
                ((checkbox.type = "checkbox"),
                    (checkbox.moveInfo = item),
                    moveCheckboxes.push(checkbox),
                    row.appendChild(checkbox));
                var articleLink = makeElement("a");
                ((articleLink.href = mw.util.getUrl(item.tr)),
                    (articleLink.textContent = " " + item.tr),
                    (articleLink.target = "_blank"),
                    row.appendChild(articleLink),
                    row.appendChild(makeText(" → ")),
                    item.subcategories.forEach(function (subcategory, index) {
                        index && row.appendChild(makeText(", "));
                        var categoryLink = makeElement("a");
                        ((categoryLink.href = mw.util.getUrl("Kategori:" + subcategory)),
                            (categoryLink.textContent = subcategory),
                            (categoryLink.target = "_blank"),
                            row.appendChild(categoryLink));
                    }),
                    moveList.appendChild(row));
            }),
                box.appendChild(moveList),
                moveSelectAll.addEventListener("change", function () {
                    moveCheckboxes.forEach(function (checkbox) {
                        checkbox.checked = moveSelectAll.checked;
                    });
                }),
                moveButton.addEventListener("click", function () {
                    var items,
                        button,
                        parent,
                        selected = [];
                    (moveCheckboxes.forEach(function (checkbox) {
                        checkbox.checked && selected.push(checkbox.moveInfo);
                    }),
                    selected.length)
                        ? ((items = selected),
                          (button = moveButton),
                          (parent = pageName
                              .replace(/^Kategori:/i, "")
                              .replace(/_/g, " ")
                              .trim()),
                          runPageEdits(
                              items,
                              button,
                              "Alt kategorilere taşınıyor",
                              function (item) {
                                  return item.tr;
                              },
                              function (content, item) {
                                  var updated = content.replace(categoryLineRegex(parent), ""),
                                      added = [];
                                  return (
                                      item.subcategories.forEach(function (name) {
                                          categoryLineRegex(name).test(updated) ||
                                              ((updated = appendCategoryLinks(updated, [
                                                  categoryWikilink(name),
                                              ])),
                                              added.push(name));
                                      }),
                                      {
                                          text: updated,
                                          summary:
                                              categoryWikilink(parent) +
                                              " yerine " +
                                              (added.length ? added : item.subcategories)
                                                  .map(categoryWikilink)
                                                  .join(", ") +
                                              " eklendi (" +
                                              catCheckCredit +
                                              ")",
                                      }
                                  );
                              },
                          ))
                        : alert("Önce en az bir madde seç.");
                }));
        } else {
            var noMoves = makeElement("div");
            ((noMoves.textContent =
                "İngilizce alt kategori yerleşimine göre taşınacak madde bulunamadı."),
                box.appendChild(noMoves));
        }
        subcategoryMoves = subcategoryMoves || [];
        var subMoveHeading = makeElement("div");
        if (
            (subMoveHeading.classList.add("ccs29", "ccs17"),
            (subMoveHeading.textContent =
                "Başka alt kategorilere taşınabilecek alt kategoriler (" +
                subcategoryMoves.length +
                ")"),
            box.appendChild(subMoveHeading),
            subcategoryMoves.length)
        ) {
            var subMoveControls = makeElement("div");
            subMoveControls.classList.add("ccs20");
            var subMoveAll = makeElement("input");
            ((subMoveAll.type = "checkbox"),
                subMoveControls.appendChild(subMoveAll),
                subMoveControls.appendChild(makeText(" Tümünü seç ")));
            var subMoveButton = makeElement("button");
            ((subMoveButton.type = "button"),
                setButtonText(subMoveButton, "Seçilen alt kategorileri taşı"),
                subMoveControls.appendChild(subMoveButton),
                box.appendChild(subMoveControls));
            var subMoveChecks = [];
            (subcategoryMoves.forEach(function (item) {
                var row = makeElement("div");
                row.classList.add("ccs22");
                var checkbox = makeElement("input");
                ((checkbox.type = "checkbox"),
                    (checkbox.moveInfo = item),
                    subMoveChecks.push(checkbox),
                    row.appendChild(checkbox));
                var childLink = makeElement("a");
                ((childLink.href = mw.util.getUrl("Kategori:" + item.tr)),
                    (childLink.textContent = " " + item.tr),
                    (childLink.target = "_blank"),
                    row.appendChild(childLink),
                    row.appendChild(makeText(" → ")),
                    item.subcategories.forEach(function (target, index) {
                        index && row.appendChild(makeText(", "));
                        var targetLink = makeElement("a");
                        ((targetLink.href = mw.util.getUrl("Kategori:" + target)),
                            (targetLink.textContent = target),
                            (targetLink.target = "_blank"),
                            row.appendChild(targetLink));
                    }),
                    box.appendChild(row));
            }),
                subMoveAll.addEventListener("change", function () {
                    subMoveChecks.forEach(function (checkbox) {
                        checkbox.checked = subMoveAll.checked;
                    });
                }),
                subMoveButton.addEventListener("click", function () {
                    var selected = subMoveChecks
                        .filter(function (checkbox) {
                            return checkbox.checked;
                        })
                        .map(function (checkbox) {
                            return checkbox.moveInfo;
                        });
                    selected.length
                        ? (async function (items, button) {
                              ((button.disabled = true), resetActionButton(button));
                              var parentName = pageName
                                      .replace(/^Kategori:/i, "")
                                      .replace(/_/g, " ")
                                      .trim(),
                                  changed = 0,
                                  failed = 0;
                              (setButtonText(
                                  button,
                                  "Alt kategoriler taşınıyor... 0/" + items.length,
                              ),
                                  await forEachEditConcurrent(
                                      items,
                                      async function (item) {
                                          try {
                                              var title = "Kategori:" + item.tr,
                                                  content = await getPageContent(title),
                                                  parentRegex = categoryLineRegex(parentName);
                                              if (!parentRegex.test(content)) return;
                                              parentRegex.lastIndex = 0;
                                              var updated = content.replace(parentRegex, "");
                                              if (
                                                  (item.subcategories.forEach(function (target) {
                                                      normalize(target) !== normalize(item.tr) &&
                                                          (categoryLineRegex(target).test(
                                                              updated,
                                                          ) ||
                                                              (updated = appendCategoryLinks(
                                                                  updated,
                                                                  [
                                                                      "[\u005bKategori:" +
                                                                          target.replace(
                                                                              /_/g,
                                                                              " ",
                                                                          ) +
                                                                          "]]",
                                                                  ],
                                                              )));
                                                  }),
                                                  updated === content)
                                              )
                                                  return;
                                              var targetLinks = item.subcategories
                                                      .map(function (target) {
                                                          return (
                                                              "[\u005bKategori:" +
                                                              target.replace(/_/g, " ") +
                                                              "]]"
                                                          );
                                                      })
                                                      .join(", "),
                                                  data = await trApiPost({
                                                      action: "edit",
                                                      title: title,
                                                      text: updated,
                                                      summary:
                                                          "Alt kategori [\u005bKategori:" +
                                                          parentName +
                                                          "]] kategorisinden " +
                                                          targetLinks +
                                                          " kategorisine taşındı ([[Kullanıcı:İmmortalance/js/CatCheck.js|''CatCheck v4.2'']])",
                                                      minor: true,
                                                  });
                                              if (!data.edit || "Success" !== data.edit.result)
                                                  throw new Error(
                                                      (data.error && data.error.info) ||
                                                          "Değişiklik kaydedilemedi.",
                                                  );
                                              (changed++, retireEditSelection(button, title));
                                          } catch (error) {
                                              (failed++,
                                                  console.error(
                                                      "[Kategori aracı]",
                                                      item.tr,
                                                      error,
                                                  ));
                                          }
                                      },
                                      function (done, total) {
                                          (setButtonText(
                                              button,
                                              "Alt kategoriler taşınıyor... " + done + "/" + total,
                                          ),
                                              setGroupProgress(button, done, total));
                                      },
                                  ),
                                  setGroupProgress(button, items.length - failed, items.length),
                                  failed
                                      ? ((button.disabled = false),
                                        setButtonText(
                                            button,
                                            changed +
                                                " alt kategori taşındı, " +
                                                failed +
                                                " işlem başarısız",
                                        ))
                                      : markCompleted(button));
                          })(selected, subMoveButton)
                        : alert("Önce en az bir alt kategori seç.");
                }));
        } else {
            var noSubMoves = makeElement("div");
            ((noSubMoves.textContent = "Taşınabilecek alt kategori bulunamadı."),
                box.appendChild(noSubMoves));
        }
        redundantSubcategories = redundantSubcategories || [];
        var redundantSubHeading = makeElement("div");
        if (
            (redundantSubHeading.classList.add("ccs29", "ccs17"),
            (redundantSubHeading.textContent =
                "Başka alt kategorilerde de bulunan alt kategoriler (" +
                redundantSubcategories.length +
                ")"),
            box.appendChild(redundantSubHeading),
            redundantSubcategories.length)
        ) {
            var redundantSubControls = makeElement("div");
            redundantSubControls.classList.add("ccs20");
            var redundantSubAll = makeElement("input");
            ((redundantSubAll.type = "checkbox"),
                redundantSubControls.appendChild(redundantSubAll),
                redundantSubControls.appendChild(makeText(" Tümünü seç ")));
            var redundantSubButton = makeElement("button");
            ((redundantSubButton.type = "button"),
                setButtonText(
                    redundantSubButton,
                    "Seçilen alt kategorileri ana kategoriden kaldır",
                ),
                redundantSubControls.appendChild(redundantSubButton),
                box.appendChild(redundantSubControls));
            var redundantSubChecks = [];
            (redundantSubcategories.forEach(function (item) {
                var row = makeElement("div");
                row.classList.add("ccs22");
                var checkbox = makeElement("input");
                ((checkbox.type = "checkbox"),
                    (checkbox.moveInfo = item),
                    redundantSubChecks.push(checkbox),
                    row.appendChild(checkbox));
                var link = makeElement("a");
                ((link.href = mw.util.getUrl("Kategori:" + item.tr)),
                    (link.textContent = " " + item.tr),
                    (link.target = "_blank"),
                    row.appendChild(link),
                    row.appendChild(
                        makeText(" — Diğer alt kategori: " + item.subcategories.join(", ")),
                    ),
                    box.appendChild(row));
            }),
                redundantSubAll.addEventListener("change", function () {
                    redundantSubChecks.forEach(function (checkbox) {
                        checkbox.checked = redundantSubAll.checked;
                    });
                }),
                redundantSubButton.addEventListener("click", function () {
                    var selected = redundantSubChecks
                        .filter(function (checkbox) {
                            return checkbox.checked;
                        })
                        .map(function (checkbox) {
                            return checkbox.moveInfo;
                        });
                    selected.length
                        ? (async function (items, button) {
                              ((button.disabled = true), resetActionButton(button));
                              var parent = pageName
                                      .replace(/^Kategori:/i, "")
                                      .replace(/_/g, " ")
                                      .trim(),
                                  changed = 0,
                                  failed = 0;
                              (setButtonText(
                                  button,
                                  "Yinelenen kategori kaldırılıyor... 0/" + items.length,
                              ),
                                  await forEachEditConcurrent(
                                      items,
                                      async function (item) {
                                          try {
                                              var title = "Kategori:" + item.tr,
                                                  content = await getPageContent(title);
                                              if (
                                                  !item.subcategories.some(function (target) {
                                                      return categoryLineRegex(target).test(
                                                          content,
                                                      );
                                                  })
                                              )
                                                  return;
                                              var parentRegex = categoryLineRegex(parent);
                                              if (!parentRegex.test(content)) return;
                                              parentRegex.lastIndex = 0;
                                              var updated = content.replace(parentRegex, ""),
                                                  data = await trApiPost({
                                                      action: "edit",
                                                      title: title,
                                                      text: updated,
                                                      summary:
                                                          "Alt kategori başka bir alt kategoride mevcut olduğundan [\u005bKategori:" +
                                                          parent +
                                                          "]] kaldırıldı ([[Kullanıcı:İmmortalance/js/CatCheck.js|''CatCheck v4.2'']])",
                                                      minor: true,
                                                  });
                                              if (!data.edit || "Success" !== data.edit.result)
                                                  throw new Error(
                                                      (data.error && data.error.info) ||
                                                          "Değişiklik kaydedilemedi.",
                                                  );
                                              (changed++, retireEditSelection(button, title));
                                          } catch (error) {
                                              (failed++,
                                                  console.error(
                                                      "[Kategori aracı]",
                                                      item.tr,
                                                      error,
                                                  ));
                                          }
                                      },
                                      function (done, total) {
                                          (setButtonText(
                                              button,
                                              "Yinelenen kategori kaldırılıyor... " +
                                                  done +
                                                  "/" +
                                                  total,
                                          ),
                                              setGroupProgress(button, done, total));
                                      },
                                  ),
                                  setGroupProgress(button, items.length - failed, items.length),
                                  failed
                                      ? ((button.disabled = false),
                                        setButtonText(
                                            button,
                                            changed +
                                                " alt kategoriden ana kategori kaldırıldı, " +
                                                failed +
                                                " işlem başarısız",
                                        ))
                                      : markCompleted(button));
                          })(selected, redundantSubButton)
                        : alert("Önce en az bir alt kategori seç.");
                }));
        } else {
            var noRedundantSubs = makeElement("div");
            ((noRedundantSubs.textContent = "Yinelenen alt kategori bulunamadı."),
                box.appendChild(noRedundantSubs));
        }
        var redundantHeading = makeElement("div");
        if (
            (redundantHeading.classList.add("ccs27", "ccs16", "ccs17"),
            (redundantHeading.textContent =
                "Alt kategorilerde de bulunan ana kategori maddeleri (" +
                redundantArticles.length +
                ")"),
            box.appendChild(redundantHeading),
            redundantArticles.length)
        ) {
            var redundantControls = makeElement("div");
            redundantControls.classList.add("ccs20");
            var redundantSelectAll = makeElement("input");
            ((redundantSelectAll.type = "checkbox"),
                redundantControls.appendChild(redundantSelectAll),
                redundantControls.appendChild(makeText(" Tümünü seç ")));
            var redundantRemoveButton = makeElement("button");
            ((redundantRemoveButton.type = "button"),
                setButtonText(redundantRemoveButton, "Seçilenleri ana kategoriden kaldır"),
                redundantRemoveButton.classList.add("ccs14", "ccs13"),
                redundantControls.appendChild(redundantRemoveButton),
                box.appendChild(redundantControls));
            var redundantList = makeElement("div");
            redundantList.classList.add("catcheck-list", "ccs22");
            var redundantCheckboxes = [];
            (redundantArticles.forEach(function (item) {
                var row = makeElement("div"),
                    checkbox = makeElement("input");
                ((checkbox.type = "checkbox"),
                    (checkbox.value = item.tr),
                    redundantCheckboxes.push(checkbox),
                    row.appendChild(checkbox));
                var link = makeElement("a");
                ((link.href = mw.util.getUrl(item.tr)),
                    (link.textContent = " " + item.tr),
                    (link.target = "_blank"),
                    row.appendChild(link));
                var detail = makeElement("span");
                (detail.classList.add("ccs30"),
                    (detail.textContent = " — Alt kategori: " + item.subcategories.join(", ")),
                    row.appendChild(detail),
                    redundantList.appendChild(row));
            }),
                box.appendChild(redundantList),
                redundantSelectAll.addEventListener("change", function () {
                    redundantCheckboxes.forEach(function (checkbox) {
                        checkbox.checked = redundantSelectAll.checked;
                    });
                }),
                redundantRemoveButton.addEventListener("click", function () {
                    var titles,
                        button,
                        parent,
                        selected = [];
                    (redundantCheckboxes.forEach(function (checkbox) {
                        checkbox.checked && !checkbox.disabled && selected.push(checkbox.value);
                    }),
                    selected.length)
                        ? ((titles = selected),
                          (button = redundantRemoveButton),
                          (parent = pageName
                              .replace(/^Kategori:/i, "")
                              .replace(/_/g, " ")
                              .trim()),
                          runPageEdits(
                              titles,
                              button,
                              "Ana kategori kaldırılıyor",
                              function (title) {
                                  return title;
                              },
                              function (content) {
                                  return {
                                      text: content.replace(categoryLineRegex(parent), ""),
                                      summary:
                                          "Alt kategoride bulunan madde üst kategoriden kaldırıldı: " +
                                          categoryWikilink(parent) +
                                          " (" +
                                          catCheckCredit +
                                          ")",
                                  };
                              },
                          ))
                        : alert("Önce en az bir madde seç.");
                }));
        } else {
            var noRedundantArticles = makeElement("div");
            ((noRedundantArticles.textContent =
                "Ana kategori ile doğrudan alt kategoriler arasında yinelenen madde bulunamadı."),
                box.appendChild(noRedundantArticles));
        }
        if (
            (collapseSections(box, [
                articleHeading,
                categoryHeading,
                parentHeading,
                moveHeading,
                subMoveHeading,
                redundantSubHeading,
                redundantHeading,
            ]),
            scan)
        ) {
            allControls.remove();
            var keys = [
                    "articles",
                    "categories",
                    "parents",
                    "moves",
                    "submoves",
                    "redundantSubs",
                    "redundantArticles",
                ],
                ready = complete ? keys : Object.keys(scan.sections);
            complete && (scan.complete = true);
            var host = old || box;
            if (!old) {
                var notice = makeElement("p");
                ((notice.className = "catcheck-ready-notice"),
                    box.insertBefore(notice, box.children[1]));
                var master = makeElement("div");
                master.className = "ccs8 ccs9 ccs10 ccs11";
                var masterLabel = makeElement("label"),
                    masterSelect = makeElement("input");
                ((masterSelect.type = "checkbox"),
                    masterLabel.appendChild(masterSelect),
                    masterLabel.appendChild(makeText(" Hazır maddeleri ve alt kategorileri seç ")),
                    master.appendChild(masterLabel));
                var masterAdd = makeElement("button");
                function readyInputs() {
                    return box.querySelectorAll(
                        '[data-scan-key="articles"] .catcheck-list input, [data-scan-key="categories"] .catcheck-list input',
                    );
                }
                ((masterAdd.type = "button"),
                    setButtonText(masterAdd, "Seçilenlerin hepsini ekle"),
                    master.appendChild(masterAdd),
                    masterSelect.addEventListener("change", function () {
                        readyInputs().forEach(function (input) {
                            input.checked = !input.disabled && masterSelect.checked;
                        });
                    }),
                    masterAdd.addEventListener("click", function () {
                        var selectedArticles = [],
                            selectedCategories = [];
                        (readyInputs().forEach(function (input) {
                            input.checked &&
                                !input.disabled &&
                                ("articles" === input.closest("details").dataset.scanKey
                                    ? selectedArticles
                                    : selectedCategories
                                ).push(input.value);
                        }),
                            selectedArticles.length || selectedCategories.length
                                ? addAllSelected(selectedArticles, selectedCategories, masterAdd)
                                : alert("Önce en az bir seçim yap."));
                    }),
                    box.insertBefore(master, notice.nextSibling));
            }
            (Array.from(box.querySelectorAll("details.catcheck-group")).forEach(
                function (group, index) {
                    var key = keys[index];
                    ((group.dataset.scanKey = key),
                        scan.full ||
                            "articles" === key ||
                            ((scan.statuses[key] = "Kapsam dışında"),
                            (group.querySelector(".catcheck-group-content").textContent =
                                "Bu kontrol için Tam tarama seçin.")));
                    var existing = old && old.querySelector('[data-scan-key="' + key + '"]');
                    if (scan.rendered[key]) group.remove();
                    else {
                        if (ready.indexOf(key) < 0) {
                            if (existing) return void group.remove();
                            ((group.querySelector("summary").firstChild.nodeValue = group
                                .querySelector("summary")
                                .firstChild.nodeValue.replace(/ \(0\)$/, "")),
                                (group.querySelector(".catcheck-group-content").textContent =
                                    scan.full || "articles" === key
                                        ? "Bu bölümün kontrolü henüz tamamlanmadı."
                                        : "Bu kontrol için Tam tarama seçin."));
                        } else ((scan.rendered[key] = true), (scan.statuses[key] = "Tamamlandı"));
                        existing
                            ? ((group.open = existing.open), existing.replaceWith(group))
                            : old && old.appendChild(group);
                    }
                },
            ),
                old || insertResultsBox(box),
                keys.forEach(function (key) {
                    setScanSection(scan, key, scan.statuses[key] || "Sıra bekliyor");
                }),
                (host.querySelector(".catcheck-ready-notice").textContent = complete
                    ? "Tarama tamamlandı. Bölümlerdeki işlem düğmelerini kullanabilirsiniz."
                    : "Tarama sürüyor. Kontrolü tamamlanan bölümlerde işlem yapabilirsiniz."));
        } else insertResultsBox(box);
        ensureSubcategoryArticleSuggestions(document.getElementById(resultId));
    }
    function insertResultsBox(box) {
        ensureResultsPanel().body.appendChild(box);
    }
    function updateWindowProgress(text) {
        var node = document.getElementById("catcheck-window-progress");
        if (node) {
            node.textContent = text;
            var position = text.indexOf("...");
            if (!(position < 0)) {
                ((node.textContent = ""), node.appendChild(makeText(text.substring(0, position))));
                var holder = makeElement("span");
                ((holder.className = "catcheck-dots-holder"),
                    holder.setAttribute("aria-hidden", "true"));
                for (var i = 0; i < 3; i++) {
                    var dot = makeElement("span");
                    ((dot.className = "catcheck-dot catcheck-dot-" + i),
                        (dot.textContent = "."),
                        holder.appendChild(dot));
                }
                (node.appendChild(holder),
                    node.appendChild(makeText(text.substring(position + 3))));
            }
        }
    }
    function actionButtonOrder(button) {
        return /üst kategorileri düzenle/i.test(button.textContent)
            ? -1
            : ["add", "move", "check", "discover", "remove", "neutral"].indexOf(
                  button.dataset.ccAction || "neutral",
              );
    }
    function collapseSections(box, headings) {
        var groups = [];
        headings.forEach(function (heading, index) {
            var next = headings[index + 1] || null,
                details = makeElement("details");
            ((details.className = "catcheck-group"), (details.open = 0 === index));
            var summary = makeElement("summary");
            for (summary.className = "catcheck-group-title"; heading.firstChild;)
                summary.appendChild(heading.firstChild);
            details.appendChild(summary);
            var content = makeElement("div");
            for (
                content.className = "catcheck-group-content";
                heading.nextSibling && heading.nextSibling !== next;
            )
                content.appendChild(heading.nextSibling);
            (!(function (content) {
                var buttons = Array.from(content.querySelectorAll("button"));
                if (buttons.length) {
                    var toolbar = makeElement("div");
                    toolbar.className = "catcheck-action-bar";
                    var selection = makeElement("div");
                    if (
                        ((selection.className = "catcheck-select-row"),
                        content.querySelectorAll("input[type=checkbox]").forEach(function (input) {
                            var label = input.closest("label");
                            if (
                                (label ? label.parentNode : input.parentNode).querySelector(
                                    "button",
                                )
                            ) {
                                if (!label) {
                                    label = makeElement("label");
                                    var text = input.nextSibling;
                                    (label.appendChild(input),
                                        text && 3 === text.nodeType && label.appendChild(text));
                                }
                                selection.appendChild(label);
                            }
                        }),
                        buttons
                            .sort(function (a, b) {
                                return actionButtonOrder(a) - actionButtonOrder(b);
                            })
                            .forEach(function (button) {
                                toolbar.appendChild(button);
                            }),
                        content.prepend(toolbar),
                        selection.firstChild)
                    ) {
                        var list = Array.from(content.children).find(function (node) {
                            return (
                                node.classList.contains("catcheck-list") ||
                                node.querySelector("input[type=checkbox]")
                            );
                        });
                        content.insertBefore(selection, list || null);
                    }
                }
            })(content),
                details.appendChild(content),
                box.replaceChild(details, heading),
                groups.push(details),
                details.addEventListener("toggle", function () {
                    details.open &&
                        details.parentNode &&
                        details.parentNode
                            .querySelectorAll("details.catcheck-group")
                            .forEach(function (other) {
                                other !== details && (other.open = false);
                            });
                }));
        });
    }
    function addMemberCountControls(categories, categoryControls) {
        var missingCategories = categories.filter(function (item) {
                return !item.hasTurkish;
            }),
            savedMemberCountProgress = loadMemberCountProgress();
        if (missingCategories.length) {
            var savedDoneCount = missingCategories.filter(function (item) {
                    var saved = savedMemberCountProgress[normalize(item.en)];
                    return saved && true === saved.done;
                }).length,
                memberCountButton = makeElement("button");
            ((memberCountButton.type = "button"),
                setButtonText(
                    memberCountButton,
                    savedDoneCount > 0 && savedDoneCount < missingCategories.length
                        ? "Hesaplamaya devam et (" +
                              savedDoneCount +
                              "/" +
                              missingCategories.length +
                              ")"
                        : savedDoneCount === missingCategories.length
                          ? "✓ Türkçe üye sayıları hazır (" +
                            savedDoneCount +
                            "/" +
                            missingCategories.length +
                            ")"
                          : "Türkçe üye sayılarını hesapla",
                ),
                memberCountButton.classList.add("ccs21"),
                categoryControls.appendChild(memberCountButton));
            var clearMemberCountButton = makeElement("button");
            ((clearMemberCountButton.type = "button"),
                setButtonText(clearMemberCountButton, "Sayım kaydını sıfırla"),
                clearMemberCountButton.classList.add("ccs21"),
                categoryControls.appendChild(clearMemberCountButton),
                clearMemberCountButton.addEventListener("click", function () {
                    (!(function () {
                        try {
                            localStorage.removeItem(getMemberCountStorageKey());
                        } catch (error) {
                            console.warn("[CatCheck] Üye sayımı ilerlemesi temizlenemedi:", error);
                        }
                    })(),
                        (savedMemberCountProgress = {}),
                        missingCategories.forEach(function (item) {
                            item.memberCountNode && (item.memberCountNode.textContent = "");
                        }),
                        (memberCountButton.disabled = false),
                        resetActionButton(memberCountButton),
                        setButtonText(memberCountButton, "Türkçe üye sayılarını hesapla"),
                        setButtonText(clearMemberCountButton, "Sayım kaydı temizlendi"),
                        setTimeout(function () {
                            setButtonText(clearMemberCountButton, "Sayım kaydını sıfırla");
                        }, 1500));
                }),
                memberCountButton.addEventListener("click", function () {
                    ((memberCountButton.disabled = true),
                        (clearMemberCountButton.disabled = true),
                        resetActionButton(memberCountButton));
                    var englishCategoriesToCount = missingCategories.map(function (item) {
                        return item.en;
                    });
                    (async function (categories, button, onUpdate) {
                        var counts = {},
                            cursor = 0,
                            completed = 0,
                            processedThisRun = 0,
                            interrupted = false,
                            stopRequested = false,
                            progress = loadMemberCountProgress(),
                            wanted = {};
                        function updateButtonText() {
                            (setGroupProgress(button, completed, categories.length),
                                setButtonText(
                                    button,
                                    "Kategorilerin Türkçe üyeleri sayılıyor... (" +
                                        completed +
                                        "/" +
                                        categories.length +
                                        ")",
                                ));
                        }
                        async function getCategoryMemberQids(category, namespace) {
                            var qids = [],
                                seen = {},
                                continuation = null;
                            do {
                                var data,
                                    params = {
                                        action: "query",
                                        generator: "categorymembers",
                                        gcmtitle: category,
                                        gcmnamespace: String(namespace),
                                        gcmlimit: "500",
                                        prop: "pageprops",
                                        ppprop: "wikibase_item",
                                        formatversion: "2",
                                    };
                                continuation &&
                                    Object.keys(continuation).forEach(function (key) {
                                        params[key] = continuation[key];
                                    });
                                try {
                                    data = await apiRequest(
                                        enApi,
                                        params,
                                        0 === namespace
                                            ? "İngilizce kategori maddeleri"
                                            : "İngilizce alt kategoriler",
                                    );
                                } catch (error) {
                                    (console.warn(
                                        "[CatCheck] Kategori sorgusu tekrar deneniyor:",
                                        category,
                                        error,
                                    ),
                                        await new Promise(function (resolve) {
                                            setTimeout(resolve, 1200);
                                        }),
                                        (data = await apiRequest(
                                            enApi,
                                            params,
                                            0 === namespace
                                                ? "İngilizce kategori maddeleri"
                                                : "İngilizce alt kategoriler",
                                        )));
                                }
                                (data &&
                                    data.query &&
                                    data.query.pages &&
                                    data.query.pages.forEach(function (page) {
                                        if (page.pageprops && page.pageprops.wikibase_item) {
                                            var qid = page.pageprops.wikibase_item;
                                            seen[qid] || ((seen[qid] = true), qids.push(qid));
                                        }
                                    }),
                                    (continuation = data && data.continue ? data.continue : null));
                            } while (continuation && !stopRequested);
                            return qids;
                        }
                        async function countTurkishSitelinks(qids, namespace) {
                            for (var count = 0, i = 0; i < qids.length; i += 50) {
                                if (stopRequested) throw new Error("İşlem durduruldu.");
                                var data,
                                    params = {
                                        action: "wbgetentities",
                                        ids: qids.slice(i, i + 50).join("|"),
                                        props: "sitelinks",
                                        sitefilter: "trwiki",
                                        format: "json",
                                    };
                                try {
                                    data = await apiRequest(
                                        wdApi,
                                        params,
                                        "Vikiveri Türkçe karşılıkları",
                                    );
                                } catch (error) {
                                    (console.warn(
                                        "[CatCheck] Wikidata grubu tekrar deneniyor:",
                                        error,
                                    ),
                                        await new Promise(function (resolve) {
                                            setTimeout(resolve, 1500);
                                        }),
                                        (data = await apiRequest(
                                            wdApi,
                                            params,
                                            "Vikiveri Türkçe karşılıkları",
                                        )));
                                }
                                data &&
                                    data.entities &&
                                    (Object.keys(data.entities).forEach(function (qid) {
                                        var entity = data.entities[qid];
                                        if (entity && entity.sitelinks && entity.sitelinks.trwiki) {
                                            var title = entity.sitelinks.trwiki.title;
                                            0 === namespace
                                                ? 0 !== title.indexOf("Kategori:") && count++
                                                : 14 === namespace &&
                                                  0 === title.indexOf("Kategori:") &&
                                                  count++;
                                        }
                                    }),
                                    i + 50 < qids.length &&
                                        (await new Promise(function (resolve) {
                                            setTimeout(resolve, 150);
                                        })));
                            }
                            return count;
                        }
                        async function processCategory(category) {
                            var qidResults = await Promise.all([
                                getCategoryMemberQids(category, 0),
                                getCategoryMemberQids(category, 14),
                            ]);
                            if (stopRequested) throw new Error("İşlem durduruldu.");
                            return {
                                articles: await countTurkishSitelinks(qidResults[0], 0),
                                categories: await countTurkishSitelinks(qidResults[1], 14),
                            };
                        }
                        async function worker() {
                            for (; !stopRequested && cursor < categories.length;) {
                                var category = categories[cursor++],
                                    key = normalize(category);
                                if (!progress[key] || true !== progress[key].done) {
                                    try {
                                        var count = await processCategory(category);
                                        if (stopRequested) return;
                                        ((counts[key] = count),
                                            (progress[key] = {
                                                category: category,
                                                articles: count.articles,
                                                categories: count.categories,
                                                done: true,
                                                updatedAt: Date.now(),
                                            }),
                                            saveMemberCountProgress(progress),
                                            completed++,
                                            processedThisRun++,
                                            "function" == typeof onUpdate &&
                                                onUpdate(category, count, "done"),
                                            updateButtonText());
                                    } catch (error) {
                                        return void (
                                            stopRequested ||
                                            (console.error(
                                                "[CatCheck] Üye sayımı yarıda kaldı:",
                                                category,
                                                error,
                                            ),
                                            (interrupted = true),
                                            (stopRequested = true),
                                            "function" == typeof onUpdate &&
                                                onUpdate(category, null, "error"))
                                        );
                                    }
                                    await new Promise(function (resolve) {
                                        setTimeout(resolve, 100);
                                    });
                                }
                            }
                        }
                        (categories.forEach(function (category) {
                            wanted[normalize(category)] = true;
                        }),
                            Object.keys(progress).forEach(function (key) {
                                wanted[key] &&
                                    progress[key] &&
                                    true === progress[key].done &&
                                    ((counts[key] = {
                                        articles: progress[key].articles,
                                        categories: progress[key].categories,
                                    }),
                                    completed++,
                                    "function" == typeof onUpdate &&
                                        onUpdate(
                                            progress[key].category || key,
                                            counts[key],
                                            "cached",
                                        ));
                            }),
                            updateButtonText());
                        for (
                            var workers = [],
                                unfinishedCount = Math.max(0, categories.length - completed),
                                w = 0;
                            w < Math.min(3, unfinishedCount);
                            w++
                        )
                            workers.push(worker());
                        return (
                            await Promise.all(workers),
                            {
                                counts: counts,
                                completed: completed,
                                total: categories.length,
                                processedThisRun: processedThisRun,
                                interrupted: interrupted || completed < categories.length,
                            }
                        );
                    })(
                        englishCategoriesToCount,
                        memberCountButton,
                        function (category, count, status) {
                            var key = normalize(category),
                                item = missingCategories.find(function (candidate) {
                                    return normalize(candidate.en) === key;
                                });
                            item &&
                                item.memberCountNode &&
                                (count
                                    ? ((item.memberCountNode.textContent =
                                          " (" +
                                          count.articles.toLocaleString("tr-TR") +
                                          "m " +
                                          count.categories.toLocaleString("tr-TR") +
                                          "k)"),
                                      (item.memberCountNode.title =
                                          "cached" === status
                                              ? "Önceki sayımdan yüklendi"
                                              : "Yeni hesaplandı"))
                                    : "error" === status &&
                                      ((item.memberCountNode.textContent = " (?)"),
                                      (item.memberCountNode.title =
                                          "Bu kategoride bağlantı veya API hatası oluştu; sonraki çalıştırmada yeniden denenecek.")));
                        },
                    )
                        .then(function (result) {
                            ((savedMemberCountProgress = loadMemberCountProgress()),
                                (clearMemberCountButton.disabled = false),
                                (memberCountButton.disabled = false),
                                result.completed >= result.total
                                    ? (markCompleted(memberCountButton),
                                      setButtonText(
                                          memberCountButton,
                                          "✓ Tamamlandı (" +
                                              result.completed +
                                              "/" +
                                              result.total +
                                              ")",
                                      ))
                                    : (resetActionButton(memberCountButton),
                                      setButtonText(
                                          memberCountButton,
                                          "Kaldığı yerden devam et (" +
                                              result.completed +
                                              "/" +
                                              result.total +
                                              ")",
                                      ),
                                      (memberCountButton.title =
                                          "Bağlantı veya API sorunu nedeniyle sayım durdu. Tamamlanan sonuçlar kaydedildi.")));
                        })
                        .catch(function (error) {
                            (console.error("[Kategori aracı]", error),
                                (clearMemberCountButton.disabled = false),
                                (memberCountButton.disabled = false));
                            var progressNow = loadMemberCountProgress(),
                                doneNow = englishCategoriesToCount.filter(function (category) {
                                    var saved = progressNow[normalize(category)];
                                    return saved && true === saved.done;
                                }).length;
                            (setButtonText(
                                memberCountButton,
                                "Kaldığı yerden devam et (" +
                                    doneNow +
                                    "/" +
                                    englishCategoriesToCount.length +
                                    ")",
                            ),
                                (memberCountButton.title = error.message || String(error)));
                        });
                }));
        }
    }
    function showResults(items, error, type) {
        var old = document.getElementById(resultId);
        old && old.remove();
        var box = makeElement("div");
        ((box.id = resultId), box.classList.add("ccs1", "ccs2", "ccs3", "ccs4", "ccs5"));
        var heading = makeElement("strong");
        if (
            ((heading.textContent = "Kategori önerileri"),
            addResultVersion(heading),
            box.appendChild(heading),
            error)
        ) {
            var errorBox = makeElement("div");
            (errorBox.classList.add("ccs6", "ccs7"),
                (errorBox.textContent = error),
                box.appendChild(errorBox));
        } else if (items.length) {
            var controls = makeElement("div");
            controls.classList.add("ccs18");
            var selectAllLabel = makeElement("label");
            selectAllLabel.classList.add("ccs31", "ccs13");
            var selectAll = makeElement("input");
            ((selectAll.type = "checkbox"),
                selectAllLabel.appendChild(selectAll),
                selectAllLabel.appendChild(makeText(" Tümünü seç")),
                controls.appendChild(selectAllLabel));
            var addButton = makeElement("button");
            ((addButton.type = "button"),
                setButtonText(addButton, "Seçilen kategorileri ekle"),
                addButton.classList.add("ccs14", "ccs13"),
                controls.appendChild(addButton),
                addMemberCountControls(items, controls),
                box.appendChild(controls));
            var list = makeElement("div");
            list.classList.add("catcheck-list", "ccs22");
            var checkboxes = [];
            (items.forEach(function (item) {
                var row = makeElement("span");
                if ((row.classList.add("ccs23", "ccs24", "ccs25"), item.hasTurkish)) {
                    var checkbox = makeElement("input");
                    ((checkbox.type = "checkbox"),
                        (checkbox.value = item.tr),
                        checkboxes.push(checkbox),
                        row.appendChild(checkbox));
                    var link = makeElement("a");
                    ((link.href = mw.util.getUrl("Kategori:" + item.tr)),
                        (link.textContent = " " + item.tr),
                        (link.target = "_blank"),
                        row.appendChild(link));
                } else {
                    var enLink = makeElement("a"),
                        cleanEn = item.en.replace(/^Category:/i, "");
                    ((enLink.href =
                        "https://en.wikipedia.org/wiki/Category:" +
                        encodeURIComponent(cleanEn.replace(/ /g, "_"))),
                        (enLink.textContent = "[EN] " + cleanEn),
                        (enLink.target = "_blank"),
                        (enLink.rel = "noopener"),
                        enLink.classList.add("ccs28"),
                        row.appendChild(enLink),
                        (item.memberCountNode = makeElement("span")));
                    var savedMemberCount = loadMemberCountProgress()[normalize(item.en)];
                    (savedMemberCount &&
                        true === savedMemberCount.done &&
                        ((item.memberCountNode.textContent =
                            " (" +
                            savedMemberCount.articles.toLocaleString("tr-TR") +
                            "m " +
                            savedMemberCount.categories.toLocaleString("tr-TR") +
                            "k)"),
                        (item.memberCountNode.title = "Önceki sayımdan yüklendi")),
                        row.appendChild(item.memberCountNode));
                }
                list.appendChild(row);
            }),
                box.appendChild(list),
                selectAll.addEventListener("change", function () {
                    checkboxes.forEach(function (checkbox) {
                        checkbox.checked = selectAll.checked;
                    });
                }),
                addButton.addEventListener("click", function () {
                    var categories,
                        button,
                        newCategories,
                        selected = [];
                    (checkboxes.forEach(function (checkbox) {
                        checkbox.checked && !checkbox.disabled && selected.push(checkbox.value);
                    }),
                    selected.length)
                        ? ((categories = selected),
                          (newCategories = []),
                          ((button = addButton).disabled = true),
                          resetActionButton(button),
                          setGroupProgress(button, 0, categories.length),
                          setButtonText(button, "Kategori ekleniyor..."),
                          getPageContent(pageName)
                              .then(function (content) {
                                  if (
                                      (categories.forEach(function (category) {
                                          new RegExp(
                                              "\\[\\[" +
                                                  escapeRegExp("Kategori:") +
                                                  escapeRegExp(category) +
                                                  "(?:\\||\\]\\])",
                                              "i",
                                          ).test(content) || newCategories.push(category);
                                      }),
                                      !newCategories.length)
                                  )
                                      return (markCompleted(button), null);
                                  var addition = newCategories.map(function (category) {
                                          return "[\u005bKategori:" + category.replace(/_/g, " ") + "]]";
                                      }),
                                      newContent = appendCategoryLinks(content, addition),
                                      summaryCategories = newCategories
                                          .map(function (category) {
                                              return (
                                                  "[\u005bKategori:" + category.replace(/_/g, " ") + "]]"
                                              );
                                          })
                                          .join(", ");
                                  return trApiPost({
                                      action: "edit",
                                      title: pageName,
                                      text: newContent,
                                      summary:
                                          "Kategori eklendi: " +
                                          summaryCategories +
                                          " (" +
                                          catCheckCredit +
                                          ")",
                                      minor: true,
                                  });
                              })
                              .then(function (data) {
                                  if (data) {
                                      if (!data.edit || "Success" !== data.edit.result)
                                          throw new Error(
                                              data.error && data.error.info
                                                  ? data.error.info
                                                  : "Değişiklik kaydedilemedi.",
                                          );
                                      (markCompleted(button, newCategories.length),
                                          setGroupProgress(
                                              button,
                                              categories.length,
                                              categories.length,
                                          ));
                                  }
                              })
                              .catch(function (error) {
                                  ((button.disabled = false),
                                      setButtonText(button, "Seçilen kategorileri ekle"),
                                      alert("Hata:\n\n" + (error.message || error)));
                              }))
                        : alert("Önce en az bir seçim yap.");
                }));
        } else {
            var none = makeElement("div");
            (none.classList.add("ccs6"),
                (none.textContent = "Yeni Türkçe kategori bulunamadı."),
                box.appendChild(none));
        }
        (!error && items.length && collapseSections(box, [heading]), insertResultsBox(box));
        ensureArticleRedundancyControls(box);
    }
    function retireEditSelection(button, title) {
        var group = button.closest("details.catcheck-group") || document.getElementById(resultId);
        group &&
            group.querySelectorAll("input[type=checkbox]").forEach(function (checkbox) {
                (normalize(checkbox.value) !== normalize(title) &&
                    normalize("Kategori:" + checkbox.value) !== normalize(title)) ||
                    ((checkbox.checked = false),
                    (checkbox.disabled = true),
                    checkbox.parentNode.classList.add("catcheck-row-done"));
            });
    }
    // Seçilen sayfalara düzenlemeleri uygula ve ilerlemeyi göster.
    async function runPageEdits(items, button, label, titleOf, transform, options) {
        ((options = options || {}), (button.disabled = true), resetActionButton(button));
        var changed = 0,
            failed = 0;
        function progress(done) {
            (setButtonText(button, label + "... " + done + "/" + items.length),
                setGroupProgress(
                    button,
                    done + (options.offset || 0),
                    options.total || items.length,
                ));
        }
        return (
            progress(0),
            await forEachEditConcurrent(
                items,
                async function (item) {
                    var title = titleOf(item);
                    try {
                        var content = await getPageContent(title),
                            plan = transform(content, item);
                        if (!plan || plan.text === content)
                            return void retireEditSelection(button, title);
                        var data = await trApiPost({
                            action: "edit",
                            title: title,
                            text: plan.text,
                            summary: plan.summary,
                            minor: true,
                        });
                        if (!data.edit || "Success" !== data.edit.result)
                            throw new Error(
                                (data.error && data.error.info) || "Değişiklik kaydedilemedi.",
                            );
                        (changed++, retireEditSelection(button, title));
                    } catch (error) {
                        (failed++, console.error("[Kategori aracı]", title, error));
                    }
                },
                progress,
            ),
            options.onComplete ? options.onComplete() : markCompleted(button),
            {
                changed: changed,
                failed: failed,
            }
        );
    }
    function addCategoryBatch(items, button, options, childCategories) {
        var parent = ((options && options.targetCategory) || pageName)
                .replace(/^Kategori:/i, "")
                .replace(/_/g, " ")
                .trim(),
            link = categoryWikilink(parent),
            regex = new RegExp(
                "\\[\\[" + escapeRegExp("Kategori:") + escapeRegExp(parent) + "(?:\\||\\]\\])",
                "i",
            );
        return runPageEdits(
            items,
            button,
            childCategories ? "Alt kategoriler güncelleniyor" : "Maddeler güncelleniyor",
            function (item) {
                return childCategories ? "Kategori:" + item : item;
            },
            function (content) {
                return regex.test(content)
                    ? null
                    : {
                          text: appendCategoryLinks(content, [link]),
                          summary:
                              (childCategories ? "Üst kategori eklendi: " : "Kategori eklendi: ") +
                              link +
                              " (" +
                              catCheckCredit +
                              ")",
                      };
            },
            options,
        );
    }
    function addCategoriesToCategory(categories, button, options) {
        return addCategoryBatch(categories, button, options, true);
    }
    function addCategoryToArticles(titles, button, options) {
        return addCategoryBatch(titles, button, options, false);
    }
    function addAllSelected(articles, categories, button) {
        function finishAll() {
            markCompleted(button, (articles.length, categories.length));
        }
        function processCategories() {
            categories.length
                ? addCategoriesToCategory(categories, button, {
                      onComplete: finishAll,
                      offset: articles.length,
                      total: articles.length + categories.length,
                  })
                : finishAll();
        }
        ((button.disabled = true),
            resetActionButton(button),
            articles.length
                ? addCategoryToArticles(articles, button, {
                      onComplete: processCategories,
                      total: articles.length + categories.length,
                  })
                : processCategories());
    }
    async function forEachEditConcurrent(items, task, onProgress) {
        var cursor = 0,
            completed = 0;
        await Promise.all(
            Array.from(
                {
                    length: Math.min(4, items.length),
                },
                async function () {
                    for (; cursor < items.length;) {
                        var item = items[cursor++];
                        (await task(item),
                            completed++,
                            onProgress && onProgress(completed, items.length));
                    }
                },
            ),
        );
    }
    function getPageContent(title) {
        return apiRequest(
            trApi,
            {
                action: "query",
                prop: "revisions",
                titles: title,
                rvprop: "content",
                rvslots: "main",
                formatversion: "2",
            },
            "Madde",
            true,
        ).then(function (data) {
            if (!data.query || !data.query.pages || !data.query.pages.length)
                throw new Error("Madde içeriği alınamadı.");
            var page = data.query.pages[0];
            if (!page.revisions) throw new Error("Madde sürümü bulunamadı.");
            return page.revisions[0].slots.main.content;
        });
    }
    // İsteğe bağlı olarak doğrudan Türkçe alt kategorilere madde öner.
    function ensureSubcategoryArticleSuggestions(box) {
        if (box && !box.querySelector(".catcheck-child-suggestions")) {
            var group = makeElement("details");
            group.className = "catcheck-group catcheck-child-suggestions";
            var heading = makeElement("summary");
            ((heading.className = "catcheck-group-title"),
                heading.appendChild(makeText("Alt kategorilere eklenebilecek maddeler")));
            var status = makeElement("small");
            ((status.className = "catcheck-section-status"),
                (status.textContent = "İsteğe bağlı"),
                heading.appendChild(status),
                group.appendChild(heading));
            var content = makeElement("div");
            content.className = "catcheck-group-content";
            var note = makeElement("p");
            ((note.textContent =
                "Bu kategorinin doğrudan altındaki tüm Türkçe kategorileri tarar. Her birinin İngilizce karşılığından, Türkçede mevcut olup ilgili alt kategoride bulunmayan maddeleri önerir."),
                content.appendChild(note));
            var start = makeElement("button");
            ((start.type = "button"),
                (start.className = "catcheck-child-scan"),
                (start.disabled = !!catCheckScanState),
                setButtonText(start, "Alt kategorilerin maddelerini tara"),
                content.appendChild(start));
            var results = makeElement("div");
            (content.appendChild(results), group.appendChild(content), box.appendChild(group));
            var records = [];
            start.addEventListener("click", async function () {
                if (!catCheckScanState) {
                    var main = document.getElementById(buttonId),
                        scan = {
                            paused: false,
                            waiters: [],
                            statuses: {},
                            rendered: {},
                            complete: false,
                        };
                    ((catCheckScanState = scan),
                        (catCheckScanButton = start),
                        (main.disabled = true),
                        setScopeDisabled(true));
                    var controls = makeElement("div");
                    controls.className = "catcheck-action-bar";
                    var pause = makeElement("button");
                    ((pause.type = "button"),
                        setButtonText(pause, "Taramayı durdur"),
                        controls.appendChild(pause),
                        content.insertBefore(controls, results),
                        (scan.controls = controls),
                        pause.addEventListener("click", function () {
                            ((scan.paused = !scan.paused),
                                setButtonText(
                                    pause,
                                    scan.paused ? "Kaldığı yerden devam et" : "Taramayı durdur",
                                ),
                                (status.textContent = scan.paused
                                    ? "Duraklatıldı"
                                    : "Kontrol ediliyor"),
                                scan.paused ||
                                    scan.waiters.splice(0).forEach(function (resolve) {
                                        resolve();
                                    }));
                        }));
                    var failures = 0;
                    try {
                        if (
                            ((group.open = true),
                            (status.textContent = "Alt kategoriler alınıyor"),
                            !records.length)
                        ) {
                            var children = await getExistingTurkishSubcategories(pageName);
                            (records = Array.from(new Set(children.titles)).map(function (title) {
                                var row = makeElement("details");
                                row.className = "catcheck-group catcheck-child-category";
                                var summary = makeElement("summary");
                                ((summary.className = "catcheck-group-title"),
                                    summary.appendChild(
                                        makeText(title.replace(/^Kategori:/i, "")),
                                    ));
                                var label = makeElement("small");
                                ((label.className = "catcheck-section-status"),
                                    (label.textContent = "Sıra bekliyor"),
                                    summary.appendChild(label));
                                var body = makeElement("div");
                                return (
                                    (body.className = "catcheck-group-content"),
                                    row.appendChild(summary),
                                    row.appendChild(body),
                                    results.appendChild(row),
                                    {
                                        title: title,
                                        label: label,
                                        body: body,
                                        done: false,
                                    }
                                );
                            })).length ||
                                (results.textContent =
                                    "Bu kategoride Türkçe alt kategori bulunamadı.");
                        }
                        for (var index = 0; index < records.length; index++) {
                            var record = records[index];
                            if (!record.done) {
                                (await scanGate(scan),
                                    (record.label.textContent = "Kontrol ediliyor"),
                                    (record.body.textContent = ""));
                                try {
                                    var info = await apiRequest(
                                            trApi,
                                            {
                                                action: "query",
                                                prop: "pageprops",
                                                titles: record.title,
                                                ppprop: "wikibase_item",
                                                formatversion: 2,
                                            },
                                            "Alt kategori",
                                        ),
                                        page =
                                            info.query && info.query.pages && info.query.pages[0],
                                        qid =
                                            page && page.pageprops && page.pageprops.wikibase_item,
                                        english = null;
                                    if (qid) {
                                        var entityData = await apiRequest(
                                                wdApi,
                                                {
                                                    action: "wbgetentities",
                                                    ids: qid,
                                                    props: "sitelinks",
                                                    sitefilter: "enwiki",
                                                },
                                                "Alt kategori karşılığı",
                                            ),
                                            entity =
                                                entityData.entities && entityData.entities[qid];
                                        english =
                                            entity &&
                                            entity.sitelinks &&
                                            entity.sitelinks.enwiki &&
                                            entity.sitelinks.enwiki.title;
                                    }
                                    if (english && /^Category:/i.test(english)) {
                                        var members = await Promise.all([
                                                getEnglishMembers(english),
                                                getExistingTurkishCategoryMembers(record.title),
                                            ]),
                                            matched = await matchArticlePipeline(
                                                members[0],
                                                null,
                                                start,
                                            ),
                                            titles = Array.from(new Set(Object.values(matched))),
                                            disambiguation = await getDisambiguationTitles(titles),
                                            existing = new Set(members[1].map(normalize));
                                        ((titles = titles.filter(function (title) {
                                            return (
                                                !disambiguation[title] &&
                                                !existing.has(normalize(title)) &&
                                                normalize(title) !==
                                                    normalize(
                                                        record.title.replace(/^Kategori:/i, ""),
                                                    )
                                            );
                                        })),
                                            renderSubcategoryArticles(record, titles),
                                            (record.label.textContent =
                                                "Tamamlandı · " + titles.length + " öneri"));
                                    } else
                                        ((record.body.textContent = qid
                                            ? "İngilizce kategori karşılığı bulunamadı."
                                            : "Vikiveri bağlantısı bulunamadı."),
                                            (record.label.textContent = "Atlandı"));
                                    record.done = true;
                                } catch (error) {
                                    (failures++,
                                        (record.label.textContent = "Tamamlanamadı"),
                                        (record.body.textContent =
                                            "Kontrol başarısız: " +
                                            (error.message || String(error))));
                                }
                                ((status.textContent =
                                    index + 1 + "/" + records.length + " kategori"),
                                    setButtonText(
                                        start,
                                        "Alt kategoriler taranıyor... " +
                                            (index + 1) +
                                            "/" +
                                            records.length,
                                    ));
                            }
                        }
                        ((scan.complete = true),
                            (status.textContent = failures
                                ? failures + " kategori tekrar denenebilir"
                                : "Tamamlandı · " + records.length + " kategori"),
                            failures || (group.dataset.complete = "true"));
                    } catch (error) {
                        (failures++,
                            (status.textContent =
                                "Tarama tamamlanamadı: " + (error.message || String(error))));
                    } finally {
                        (endScan(scan),
                            (catCheckScanButton = null),
                            (main.disabled = false),
                            setButtonText(
                                start,
                                failures
                                    ? "Tamamlanamayanları tekrar tara"
                                    : "✓ Alt kategori taraması tamamlandı",
                            ),
                            (start.disabled = "true" === group.dataset.complete));
                    }
                }
            });
        }
    }
    function renderSubcategoryArticles(record, titles) {
        if (titles.length) {
            var toolbar = makeElement("div");
            toolbar.className = "catcheck-action-bar";
            var add = makeElement("button");
            ((add.type = "button"),
                setButtonText(add, "Seçilen maddeleri bu alt kategoriye ekle"),
                toolbar.appendChild(add),
                record.body.appendChild(toolbar));
            var select = makeElement("label");
            select.className = "catcheck-select-row";
            var all = makeElement("input");
            ((all.type = "checkbox"),
                select.appendChild(all),
                select.appendChild(makeText(" Tümünü seç")),
                record.body.appendChild(select));
            var list = makeElement("div");
            list.className = "catcheck-list";
            var checks = titles.map(function (title) {
                var row = makeElement("span"),
                    input = makeElement("input");
                ((input.type = "checkbox"),
                    (input.value = title),
                    input.setAttribute("aria-label", title),
                    row.appendChild(input));
                var link = makeElement("a");
                return (
                    (link.href = mw.util.getUrl(title)),
                    (link.textContent = title),
                    (link.target = "_blank"),
                    (link.rel = "noopener"),
                    row.appendChild(link),
                    list.appendChild(row),
                    input
                );
            });
            (record.body.appendChild(list),
                all.addEventListener("change", function () {
                    checks.forEach(function (input) {
                        input.checked = !input.disabled && all.checked;
                    });
                }),
                add.addEventListener("click", function () {
                    var selected = checks
                        .filter(function (input) {
                            return input.checked && !input.disabled;
                        })
                        .map(function (input) {
                            return input.value;
                        });
                    selected.length
                        ? addCategoryToArticles(selected, add, {
                              targetCategory: record.title,
                          })
                        : alert("Önce en az bir madde seç.");
                }));
        } else record.body.textContent = "Eklenecek madde bulunamadı.";
    }
    // Gizli kategorileri dışarıda bırakarak doğrudan üst kategorileri al.
    async function getVisibleCategoryParents(titles, button) {
        var result = Object.create(null);
        var progress = createReadProgress(
            "Kategori ilişkileri kontrol ediliyor",
            titles.length,
            button,
        );
        for (var i = 0; i < titles.length; i += 50) {
            var batch = titles.slice(i, i + 50),
                continuation = {};
            do {
                var data = await progress.request(
                    trApi,
                    Object.assign(
                        {
                            action: "query",
                            prop: "categories",
                            titles: batch.join("|"),
                            clshow: "!hidden",
                            cllimit: "max",
                            formatversion: 2,
                        },
                        continuation,
                    ),
                    "Türkçe kategori ilişkileri",
                );
                if (!data.query || !data.query.pages)
                    throw new Error("Kategori ilişkileri alınamadı.");
                data.query.pages.forEach(function (page) {
                    var key = normalize(page.title);
                    if (!result[key]) result[key] = [];
                    (page.categories || []).forEach(function (cat) {
                        if (
                            !isIgnoredParentCategory(cat.title) &&
                            result[key].indexOf(cat.title) < 0
                        )
                            result[key].push(cat.title);
                    });
                });
                continuation = data.continue;
            } while (continuation);
        }
        return result;
    }
    function directCategoryContent(content) {
        return content.replace(
            /<!--[\s\S]*?(?:-->|$)|<(nowiki|pre|source|syntaxhighlight)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
            "",
        );
    }
    function hasDirectCategory(content, title) {
        return categoryLineRegex(title.replace(/^Kategori:/i, "")).test(
            directCategoryContent(content),
        );
    }
    // Kategori döngülerini atla; maddede hem alt hem üst kategori bulunan üyelikleri bul.
    function findRedundantArticleCategories(titles, parents, content) {
        var names = Object.create(null),
            result = Object.create(null);
        titles.forEach(function (title) {
            if (hasDirectCategory(content, title)) names[normalize(title)] = title;
        });
        function reaches(from, target, seen) {
            if (from === target) return true;
            if (seen.has(from)) return false;
            seen.add(from);
            return (parents[from] || []).some(function (parent) {
                var key = normalize(parent);
                return !!names[key] && reaches(key, target, seen);
            });
        }
        Object.keys(names).forEach(function (child) {
            (parents[child] || []).forEach(function (parent) {
                var key = normalize(parent);
                if (!names[key] || reaches(key, child, new Set())) return;
                if (!result[key]) result[key] = { parent: names[key], children: [] };
                result[key].children.push(names[child]);
            });
        });
        return Object.values(result);
    }
    async function loadArticleRevision() {
        var data = await apiRequest(
            trApi,
            {
                action: "query",
                prop: "revisions",
                titles: pageName,
                rvprop: "ids|content",
                rvslots: "main",
                formatversion: 2,
            },
            "Güncel madde",
            true,
        );
        var revision =
            data.query &&
            data.query.pages &&
            data.query.pages[0].revisions &&
            data.query.pages[0].revisions[0];
        if (!revision || !revision.slots || !revision.slots.main)
            throw new Error("Güncel madde içeriği alınamadı.");
        return { text: revision.slots.main.content, revid: revision.revid };
    }
    // Madde taramasında otomatik çalışan üst kategori kontrolünün arayüzü.
    function ensureArticleRedundancyControls(box) {
        if (ns !== 0 || box.querySelector(".catcheck-article-redundancy")) return;
        var group = makeElement("details");
        group.className = "catcheck-group catcheck-article-redundancy";
        var summary = makeElement("summary");
        summary.className = "catcheck-group-title";
        summary.textContent = "Üst kategoride yinelenen üyelikler";
        var status = makeElement("small");
        status.className = "catcheck-section-status";
        status.textContent = "Sıra bekliyor";
        summary.appendChild(status);
        var body = makeElement("div");
        body.className = "catcheck-group-content";
        var toolbar = makeElement("div");
        toolbar.className = "catcheck-action-bar";
        var check = makeElement("button");
        check.type = "button";
        check.className = "catcheck-article-redundancy-check";
        check.disabled = !!catCheckScanState;
        setButtonText(check, "Üst kategori kontrolünü yenile");
        toolbar.appendChild(check);
        body.appendChild(toolbar);
        var notice = makeElement("p");
        notice.textContent =
            "Doğrudan alt ve üst kategorilere aynı anda eklenmiş bu madde için üst kategori kaldırma önerileri. Seçimleri gözden geçirin; yalnızca seçilen üst kategoriler kaldırılır.";
        body.appendChild(notice);
        var results = makeElement("div");
        body.appendChild(results);
        group.appendChild(summary);
        group.appendChild(body);
        box.appendChild(group);
        group.catcheckRun = async function (automatic) {
            if (catCheckScanState && !automatic) return;
            var main = document.getElementById(buttonId);
            main.disabled = check.disabled = true;
            results.textContent = "";
            group.open = true;
            status.textContent = "Kontrol ediliyor";
            try {
                var articleCats = await getVisibleCategoryParents([pageName], check);
                var titles = articleCats[normalize(pageName)] || [];
                var parents = await getVisibleCategoryParents(titles, check);
                var revision = await loadArticleRevision();
                var items = findRedundantArticleCategories(titles, parents, revision.text);
                notice.textContent = items.length
                    ? items.length +
                      " üst kategori için kaldırma önerisi bulundu. Korunacak alt kategoriler her önerinin yanında gösterilir."
                    : "Doğrudan alt ve üst kategoriler arasında yinelenen üyelik bulunamadı.";
                if (items.length) renderArticleRedundancy(items, results, check, main, notice);
                markCompleted(check);
                status.textContent = "Tamamlandı";
                setButtonText(check, "Üst kategori kontrolünü yenile");
            } catch (error) {
                status.textContent = "Tamamlanamadı";
                notice.textContent = "Kontrol tamamlanamadı: " + (error.message || String(error));
                setButtonText(check, "Kategori üyeliklerini tekrar kontrol et");
            } finally {
                main.disabled = check.disabled = false;
            }
        };
        check.addEventListener("click", function () {
            group.catcheckRun(false);
        });
    }
    // Seçilen üst kategorileri, güncel üyelikleri doğrulayarak kaldır.
    function renderArticleRedundancy(items, host, check, main, notice) {
        var toolbar = makeElement("div");
        toolbar.className = "catcheck-action-bar";
        var remove = makeElement("button");
        remove.type = "button";
        setButtonText(remove, "Seçilen üst kategorileri maddeden kaldır");
        toolbar.appendChild(remove);
        host.appendChild(toolbar);
        var label = makeElement("label");
        label.className = "catcheck-select-row";
        var all = makeElement("input");
        all.type = "checkbox";
        label.appendChild(all);
        label.appendChild(makeText(" Tümünü seç"));
        host.appendChild(label);
        var list = makeElement("div");
        list.className = "catcheck-list catcheck-redundancy-list";
        var checks = items.map(function (item) {
            var row = makeElement("span");
            var input = makeElement("input");
            input.type = "checkbox";
            input.value = item.parent;
            input.redundancy = item;
            input.setAttribute("aria-label", item.parent);
            row.appendChild(input);
            var text = makeElement("span");
            [item.parent].concat(item.children).forEach(function (title, index) {
                if (index) text.appendChild(makeText(index === 1 ? " — Korunacak: " : ", "));
                var link = makeElement("a");
                link.href = mw.util.getUrl(title);
                link.textContent = title.replace(/^Kategori:/i, "");
                link.target = "_blank";
                link.rel = "noopener";
                text.appendChild(link);
            });
            row.appendChild(text);
            list.appendChild(row);
            return input;
        });
        host.appendChild(list);
        all.addEventListener("change", function () {
            checks.forEach(function (input) {
                input.checked = all.checked && !input.disabled;
            });
        });
        remove.addEventListener("click", async function () {
            var selected = checks.filter(function (input) {
                return input.checked && !input.disabled;
            });
            if (!selected.length) {
                alert("Önce en az bir üst kategori seç.");
                return;
            }
            remove.disabled = check.disabled = main.disabled = true;
            setButtonText(remove, "Üst kategoriler kaldırılıyor...");
            try {
                var revision = await loadArticleRevision();
                var selectedNames = new Set(
                    selected.map(function (input) {
                        return normalize(input.value);
                    }),
                );
                var children = Array.from(
                    new Set(
                        selected.flatMap(function (input) {
                            return input.redundancy.children;
                        }),
                    ),
                );
                var parents = await getVisibleCategoryParents(children, remove);
                var removed = [];
                selected.forEach(function (input) {
                    var item = input.redundancy;
                    var retained = item.children.some(function (child) {
                        return (
                            !selectedNames.has(normalize(child)) &&
                            hasDirectCategory(revision.text, child) &&
                            (parents[normalize(child)] || []).some(function (parent) {
                                return normalize(parent) === normalize(item.parent);
                            })
                        );
                    });
                    if (retained && hasDirectCategory(revision.text, item.parent))
                        removed.push(item.parent);
                });
                var updated = revision.text
                    .split(
                        /(<!--[\s\S]*?(?:-->|$)|<(?:nowiki|pre|source|syntaxhighlight)\b[^>]*>[\s\S]*?<\/(?:nowiki|pre|source|syntaxhighlight)\s*>)/gi,
                    )
                    .map(function (part, index) {
                        if (index % 2) return part;
                        removed.forEach(function (title) {
                            part = part.replace(
                                categoryLineRegex(title.replace(/^Kategori:/i, "")),
                                "",
                            );
                        });
                        return part;
                    })
                    .join("");
                if (updated !== revision.text) {
                    var data = await trApiPost({
                        action: "edit",
                        title: pageName,
                        text: updated,
                        baserevid: revision.revid,
                        summary:
                            "Alt kategoride bulunan maddenin yinelenen üst kategorileri kaldırıldı: " +
                            removed
                                .map(function (title) {
                                    return categoryWikilink(title.replace(/^Kategori:/i, ""));
                                })
                                .join(", ") +
                            " (" +
                            catCheckCredit +
                            ")",
                        minor: true,
                    });
                    if (!data.edit || data.edit.result !== "Success")
                        throw new Error(
                            (data.error && data.error.info) || "Değişiklik kaydedilemedi.",
                        );
                    selected.forEach(function (input) {
                        if (removed.indexOf(input.value) >= 0) {
                            input.checked = false;
                            input.disabled = true;
                            input.parentNode.classList.add("catcheck-row-done");
                        }
                    });
                }
                notice.textContent =
                    removed.length +
                    " üst kategori kaldırıldı." +
                    (removed.length < selected.length
                        ? " Diğer seçimler güncel üyelik veya korunacak alt kategori koşulunu sağlamadığı için atlandı. Yeniden kontrol edebilirsiniz."
                        : "");
                markCompleted(remove);
            } catch (error) {
                notice.textContent = "Düzeltme kaydedilemedi: " + (error.message || String(error));
                setButtonText(remove, "Üst kategorileri kaldırmayı tekrar dene");
            } finally {
                remove.disabled = check.disabled = main.disabled = false;
            }
        });
    }
    function setScopeDisabled(disabled) {
        var redundancy = document.querySelector(".catcheck-article-redundancy-check");
        if (redundancy) redundancy.disabled = disabled;
        var child = document.querySelector(".catcheck-child-scan");
        child &&
            (child.disabled = disabled || "true" === child.closest("details").dataset.complete);
        var full = document.getElementById("catcheck-full-search");
        if (full) {
            var done = catCheckLastScan && catCheckLastScan.full && catCheckLastScan.complete;
            ((full.disabled = disabled || !!done),
                setButtonText(full, done ? "✓ Tam arama tamamlandı" : "Tam arama"));
        }
    }
    function createButton() {
        var heading = document.querySelector("#firstHeading");
        if (heading && !document.getElementById(buttonId)) {
            var button = makeElement("button");
            ((button.id = buttonId),
                (button.type = "button"),
                0 === ns
                    ? (setButtonText(button, "CatCheck"),
                      (button.title = "Vikiveri ve İngilizce Vikipedi kategorilerine göre öner"))
                    : (setButtonText(button, "CatCheck"),
                      (button.title =
                          "İngilizce kategori üyelerinin Türkçe karşılıklarını ve alt kategorilerini bul")),
                button.addEventListener("click", function () {
                    0 === ns
                        ? findCategorySuggestions(button)
                        : (!(function (button) {
                              var panel = ensureResultsPanel();
                              reopenResultsPanel();
                              var controls = document.getElementById("catcheck-scope-choices");
                              if (!controls) {
                                  (controls = makeElement("div")).id = "catcheck-scope-choices";
                                  var full = makeElement("button");
                                  ((full.type = "button"),
                                      (full.id = "catcheck-full-search"),
                                      setButtonText(full, "Tam arama"),
                                      (full.title =
                                          "Hazır madde sonuçlarını koruyarak alt ve üst kategori, taşıma ve yinelenen üyelik kontrollerini başlat"),
                                      full.addEventListener("click", function () {
                                          catCheckScanState ||
                                              (catCheckLastScan &&
                                              catCheckLastScan.complete &&
                                              !catCheckLastScan.full &&
                                              catCheckLastScan.extend
                                                  ? catCheckLastScan.extend()
                                                  : findArticleSuggestions(button, true));
                                      }),
                                      controls.appendChild(full),
                                      panel.body.prepend(controls));
                              }
                          })(button),
                          findArticleSuggestions(button, false));
                }),
                heading.appendChild(button));
        }
    }
})();