(() => {
  const links = [...document.querySelectorAll('[data-version]')];
  const releases = [...document.querySelectorAll('[data-release]')];
  const markActive = version => {
    links.forEach(link => {
      const active = link.dataset.version === version;
      link.classList.toggle('active', active);
      if (active) {
        link.setAttribute('aria-current', 'location');
        const nav = link.parentElement;
        if (window.matchMedia('(max-width:760px)').matches) {
          nav.scrollLeft = link.offsetLeft - nav.offsetLeft - (nav.clientWidth - link.clientWidth) / 2;
        }
      }
      else link.removeAttribute('aria-current');
    });
  };
  markActive('0.1.0');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      if (visible.length) {
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        markActive(visible[0].target.dataset.release);
      }
    }, {rootMargin: '-12% 0px -60% 0px', threshold: 0});
    releases.forEach(release => observer.observe(release));
  }
  links.forEach(link => link.addEventListener('click', () => markActive(link.dataset.version)));
  const dialog = document.getElementById('image-dialog');
  const dialogImage = document.getElementById('dialog-image');
  const caption = document.getElementById('dialog-caption');
  document.querySelectorAll('[data-image]').forEach(button => {
    button.addEventListener('click', () => {
      dialogImage.src = button.dataset.image;
      dialogImage.alt = button.querySelector('img').alt;
      caption.textContent = button.dataset.caption;
      dialog.showModal();
    });
  });
  document.getElementById('close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
})();
