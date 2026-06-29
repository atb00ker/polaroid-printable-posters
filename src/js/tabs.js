(function () {
  const tabImage = document.getElementById('tab-image');
  const tabPdf = document.getElementById('tab-pdf');
  const panelImage = document.getElementById('panel-image');
  const panelPdf = document.getElementById('panel-pdf');
  const pageSubtitle = document.getElementById('page-subtitle');
  const app = document.querySelector('.app');

  const subtitles = {
    image: 'Upload an image and metadata to generate a printable poster.',
    pdf: 'Upload two images with metadata to generate a printable A4 landscape PDF.',
  };

  function activateTab(tab) {
    const isImage = tab === 'image';

    tabImage.setAttribute('aria-selected', String(isImage));
    tabPdf.setAttribute('aria-selected', String(!isImage));
    panelImage.hidden = !isImage;
    panelPdf.hidden = isImage;
    pageSubtitle.textContent = isImage ? subtitles.image : subtitles.pdf;

    const formHidden = isImage
      ? document.getElementById('form-section').hidden
      : document.getElementById('pdf-form-section').hidden;
    pageSubtitle.hidden = formHidden;

    app.classList.toggle('app--wide', !isImage);
  }

  tabImage.addEventListener('click', () => activateTab('image'));
  tabPdf.addEventListener('click', () => activateTab('pdf'));

  window.PosterTabs = { activateTab };
})();
