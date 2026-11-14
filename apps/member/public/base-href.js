/* global document, location */
// The company app lives at /<company slug>/ (platform spec U12): its base address is the first segment of the address.
// This is a file, not an inline script, because the API's content-security policy forbids inline scripts.
(function () {
  const first = location.pathname.split('/')[1] || 'member';
  document.write('<base href="/' + first + '/">');
})();
