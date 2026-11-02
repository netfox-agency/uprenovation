/* Up Rénovation 33 · suivi des demandes, commun à l'accueil et aux pages de campagne.
   Conversions Google Ads (devis + appel), provenance de chaque demande (gclid, campagne, page).
   Réglages : config.js. Chargé avant le script de la page. */
(function () {
  'use strict';
  /* ============================================================
     SUIVI DES CONVERSIONS (Google Ads / GA4 / Meta via GTM)
     Les deux conversions d'un couvreur : le devis (formulaire) et
     l'appel (clic sur un numéro). On les pousse dans dataLayer, que
     GTM lit. dataLayer est un simple tableau : inoffensif sans GTM.

     Aucun conteneur GTM sur ces landings pour l instant.
     Les evenements pousses ici sont lisibles comme declencheurs dans GTM.
     ============================================================ */
  // Pas de GTM ici : dataLayer reste un simple tableau, prêt si on en ajoute un dans
  // le <head> de chaque page, comme Google le demande. On ne le charge donc
  // PAS ici : ce serait un double chargement. On se contente de garantir que
  // dataLayer existe avant nos push (script defere, GTM est deja passe).
  window.dataLayer = window.dataLayer || [];

  /* ============================================================
     GOOGLE ADS — conversions en direct (sans GTM)
     Plus simple que GTM pour un site statique : le tag officiel
     suffit. Tant que les identifiants sont des placeholders, rien
     n'est chargé (aucune requête, aucun cookie).

     INACTIF tant que AW_ID et les deux étiquettes contiennent XXXX.

     IMPORTANT : les conversions Google Ads sont envoyees ICI, en direct.
     Ne PAS creer de balise de conversion Google Ads dans GTM : elle
     compterait une deuxieme fois la meme conversion. GTM reste dedie a
     GA4 et aux autres outils.
     ============================================================ */
  var CFG = window.UPR || {};
  var AW_ID = CFG.AW_ID || 'AW-XXXXXXXXXX';
  var LABEL_DEVIS = CFG.LABEL_DEVIS || 'XXXX';
  var LABEL_APPEL = CFG.LABEL_APPEL || 'XXXX';
  var adsOn = AW_ID.indexOf('XXXX') === -1;

  if (adsOn) {
    var gs = document.createElement('script');
    gs.async = true;
    gs.src = 'https://www.googletagmanager.com/gtag/js?id=' + AW_ID;
    document.head.appendChild(gs);
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', AW_ID);
  }

  // Valeur indicative d'un lead (sert au calcul de rentabilité dans Ads).
  // Ce n'est pas le prix du chantier : c'est la valeur moyenne d'une
  // demande, marge et taux de transformation compris.
  var VALEUR_DEVIS = 120;
  var VALEUR_APPEL = 120;

  function conversion(label, valeur) {
    if (!adsOn || label.indexOf('XXXX') !== -1) return;
    gtag('event', 'conversion', {
      send_to: AW_ID + '/' + label,
      value: valeur,
      currency: 'EUR',
      transaction_id: ATTR.ref
    });
  }

  /* ============================================================
     ATTRIBUTION — savoir d'où vient chaque demande
     On mémorise (90 jours) le premier ET le dernier contact : le
     gclid de Google Ads, la campagne, le mot-clé, la page d'entrée.
     Ces informations partent avec le formulaire : Peter voit dans
     chaque mail d'où vient la demande, et on peut plus tard
     réinjecter les chantiers signés dans Google Ads.
     ============================================================ */
  var ATTR_KEY = 'upr_attr', ATTR_JOURS = 90;

  function refDemande() {
    var d = new Date(), p = function (n) { return ('0' + n).slice(-2); };
    return 'UPR-' + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate())
      + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  var ATTR = (function () {
    var q, stock = null, now = Date.now();
    try { q = new URLSearchParams(location.search); } catch (e) { q = null; }
    try { stock = JSON.parse(localStorage.getItem(ATTR_KEY)); } catch (e) { stock = null; }
    if (stock && now - stock.first_ts > ATTR_JOURS * 864e5) stock = null;

    var get = function (k) { return (q && q.get(k)) || ''; };
    // gbraid / wbraid : équivalents du gclid quand iOS masque le clic
    var clic = get('gclid') || get('gbraid') || get('wbraid');
    var utm = {
      source: get('utm_source'), medium: get('utm_medium'),
      campagne: get('utm_campaign'), mot_cle: get('utm_term'), contenu: get('utm_content')
    };
    var ref = document.referrer || '';
    var canal = clic ? 'Google Ads'
      : utm.source ? utm.source
        : !ref ? 'Direct'
          : /google\./.test(ref) ? 'Google (naturel)'
            : /bing\.|yahoo\./.test(ref) ? 'Autre moteur'
              : 'Site référent';

    if (!stock) {
      stock = { first_ts: now, first_canal: canal, first_page: location.pathname, ref: refDemande() };
    }
    if (clic || utm.source || utm.campagne || !stock.last_ts) {
      stock.last_ts = now;
      stock.last_canal = canal;
      stock.last_page = location.pathname;
      stock.referrer = ref;
      if (clic) stock.gclid = clic;
      if (utm.source || utm.campagne) stock.utm = utm;
    }
    try { localStorage.setItem(ATTR_KEY, JSON.stringify(stock)); } catch (e) {}
    return stock;
  })();

  // Ajoute les informations de provenance à l'envoi du formulaire.
  function ajouterProvenance(fd) {
    var u = ATTR.utm || {};
    var d = function (ts) { return ts ? new Date(ts).toLocaleDateString('fr-FR') : ''; };
    fd.append('Reference', ATTR.ref || '');
    fd.append('Provenance', ATTR.last_canal || '');
    fd.append('Campagne', u.campagne || '');
    fd.append('Mot-cle', u.mot_cle || '');
    fd.append('Identifiant clic Google (gclid)', ATTR.gclid || '');
    fd.append('Page du formulaire', location.pathname);
    fd.append('Premiere visite', d(ATTR.first_ts) + ' (' + (ATTR.first_canal || '') + ')');
    fd.append('Page d entree', ATTR.first_page || '');
    return fd;
  }

  // Conversion « appel » : tout clic sur un lien tel:
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"]');
    if (!a) return;
    window.dataLayer.push({
      event: 'phone_call', source: a.className || 'lien',
      provenance: ATTR.last_canal || '', gclid: ATTR.gclid || ''
    });
    conversion(LABEL_APPEL, VALEUR_APPEL);
  }, true);

  window.UPR_SUIVI = {
    attr: ATTR, provenance: ajouterProvenance,
    devis: function () { conversion(LABEL_DEVIS, VALEUR_DEVIS); }
  };
})();
