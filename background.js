chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.url) {
        chrome.tabs.sendMessage(tabId, {
            message: "urlChanged",
            url: changeInfo.url
        });
    }

    // Verifică dacă tab-ul este complet încărcat pentru a evita solicitările inutile
    if (changeInfo.status === 'complete') {
        // Obține date despre site-ul curent
        fetchSiteData(tab.url, tabId);
    }
});

function fakeNewsCheck(hostname) {
    return hostname.includes('sputnik') || hostname.includes('vedomosti') || 
           hostname.includes('.kp.') || hostname.includes('kp.') || hostname.includes('kp-') || hostname.includes('-kp-');
}

function fetchSiteData(url, tabId) {
    fetch(`https://dimonxxll.pythonanywhere.com/api/sites?url=${encodeURIComponent(url)}`)
        .then(response => response.json())
        .then(data => {
            const tabHostname = new URL(url).hostname;
            const siteFound = data.find(site => tabHostname === new URL(site.url).hostname || tabHostname === new URL(site.url).hostname.replace(/^www\./, ''));

            // Verifică dacă site-ul este cunoscut ca fiind sursă de fake news
            if (fakeNewsCheck(tabHostname)) {
                chrome.action.setBadgeText({tabId: tabId, text: '100'});
                chrome.action.setBadgeBackgroundColor({tabId: tabId, color: '#bcbcbc'}); // Roșu pentru alertă
            } else if (siteFound && siteFound.fake_news_detected) {
                chrome.action.setBadgeText({tabId: tabId, text: siteFound.fake_news_detected.toString()});
                chrome.action.setBadgeBackgroundColor({tabId: tabId, color: '#bcbcbc'});
            } else {
                chrome.action.setBadgeText({tabId: tabId, text: ''});
            }
        })
        .catch(error => {
            console.error('Error fetching site data:', error);
            chrome.action.setBadgeText({tabId: tabId, text: ''});
        });
}
