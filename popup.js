document.addEventListener("DOMContentLoaded", function () {
  const fakeNewsCountElement = document.getElementById("fakeCount");
  const siteStatusElement = document.getElementById("siteStatus");
  const detectorStatusElement = document.getElementById("detectorStatus");
  const sourceButton = document.getElementById("sourceButton"); 
  const toggleButton = document.getElementById("extensionToggle");
  const reportFakeButton = document.getElementById("reportFakeButton");

  let extensionActive = true;
  toggleButton.checked = extensionActive;
  updateContent(extensionActive);

  toggleButton.addEventListener("change", function () {
    extensionActive = this.checked;
    updateContent(extensionActive);
  });

  reportFakeButton.addEventListener("click", function() {
    window.open("https://semnale.stopfals.md/ro/semnale/new/", "_blank");
  });

  function updateContent(active) {
    if (active) {
      fetchSiteData();
      detectorStatusElement.style.color = "green";
      detectorStatusElement.textContent = "Detector Activat";
    } else {
      clearContent();
      detectorStatusElement.style.color = "red";
      detectorStatusElement.textContent = "Detectorul este oprit";
    }
  }

  function normalizeHostname(hostname) {
    // Elimină 'www.' dacă există
    return hostname.replace(/^www\./, '');
  }

  function fakeNewsCheck(hostname) {
    return hostname.includes('sputnik') || hostname.includes('vedomosti')  ||
           hostname.includes('.kp.') || hostname.includes('kp.') || hostname.includes('kp-') || hostname.includes('-kp-');
  }

  function fetchSiteData() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const tab = tabs[0];
      const tabHostname = new URL(tab.url).hostname;

      fetch(`https://dimonxxll.pythonanywhere.com/api/sites?url=${encodeURIComponent(tab.url)}`)
        .then((response) => response.json())
        .then((data) => {
          const siteFound = data.find(
            (site) => normalizeHostname(new URL(site.url).hostname) === normalizeHostname(tabHostname)
          );

          // Verifică dacă site-ul este cunoscut ca fiind sursă de fake news
          if (fakeNewsCheck(tabHostname)) {
            fakeNewsCountElement.textContent = '100';
            siteStatusElement.textContent = "Site cunoscut pentru știri false";
            sourceButton.style.display = "none"; // Ascunde butonul de sursă dacă este necesar
          } else if (siteFound) {
            fakeNewsCountElement.textContent = siteFound.fake_news_detected;
            if (siteFound.fake_news_detected > 3) {
              siteStatusElement.textContent = "Multe știri false detectate";
            } else if (siteFound.fake_news_detected > 0) {
              siteStatusElement.textContent = "Unele știri false detectate";
            } else {
              siteStatusElement.textContent = "Nu au fost detectate știri false sau site-ul încă nu a fost verificat";
            }
            sourceButton.style.display = siteFound.source ? "block" : "none";
            sourceButton.onclick = siteFound.source ? () => window.open(siteFound.source, "_blank") : null;
          } else {
            siteStatusElement.textContent = "Nu au fost detectate știri false sau site-ul încă nu a fost verificat";
            fakeNewsCountElement.textContent = "";
            sourceButton.style.display = "none";
          }
        })
        .catch((error) => {
          console.error("Error fetching site data:", error);
          siteStatusElement.textContent = "Nu au fost detectate știri false sau site-ul încă nu a fost verificat";
          fakeNewsCountElement.textContent = "";
          sourceButton.style.display = "none";
        });
    });
  }

  function clearContent() {
    fakeNewsCountElement.textContent = "";
    siteStatusElement.textContent = "";
    sourceButton.style.display = "none";
  }

  if (extensionActive) {
    fetchSiteData();
  }
});
