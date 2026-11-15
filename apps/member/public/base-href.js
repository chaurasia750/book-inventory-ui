/* global document, location */
// The company app lives at /<company slug>/ (platform spec U12): its base address is the first segment of the address.
// The host writes that <base> into index.html when it serves the page (scripts/serve-single.mjs, the API's SpaHosting),
// because the browser reads the page's preload hints before any script runs. This file is the fallback for a host that
// does not, so it adds a <base> only when the page has none. It is a file, not an inline script, because the API's
// content-security policy forbids inline scripts.
(function () {
  if (document.querySelector('base')) return;
  const first = location.pathname.split('/')[1] || 'member';
  document.write('<base href="/' + first + '/">');
})();
