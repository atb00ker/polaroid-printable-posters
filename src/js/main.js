(function () {
  const Poster = window.Poster;
  const PosterFonts = window.PosterFonts;
  const { createMetadataRow, collectMetadata, createImageLoader, buildFontPicker, syncFontPickerGroup } =
    window.PosterShared;

  const form = document.getElementById('poster-form');
  const formSection = document.getElementById('form-section');
  const previewSection = document.getElementById('preview-section');
  const pageSubtitle = document.getElementById('page-subtitle');
  const imageInput = document.getElementById('image');
  const imageError = document.getElementById('image-error');
  const metadataFields = document.getElementById('metadata-fields');
  const addFieldBtn = document.getElementById('add-field');
  const canvas = document.getElementById('poster-canvas');
  const editBtn = document.getElementById('edit-btn');
  const downloadPngBtn = document.getElementById('download-png');
  const downloadJpegBtn = document.getElementById('download-jpeg');
  const fontPickerForm = document.getElementById('font-picker-form');
  const fontPickerPreview = document.getElementById('font-picker-preview');

  const imageLoader = createImageLoader();

  /** @type {PosterData | null} */
  let currentPosterData = null;

  async function selectFontPreset(id) {
    PosterFonts.setActivePreset(id);
    syncFontPickerGroup('font-preset-form', id);
    syncFontPickerGroup('font-preset-preview', id);

    if (currentPosterData) {
      currentPosterData.fontPresetId = id;
      await Poster.ensureFontsLoaded();
      Poster.renderPoster(canvas, currentPosterData);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    imageError.hidden = true;

    const file = imageInput.files[0];
    if (!file) {
      imageError.hidden = false;
      imageInput.focus();
      return;
    }

    let image;
    try {
      image = await imageLoader.load(file);
    } catch {
      imageError.textContent = 'Could not load the selected image.';
      imageError.hidden = false;
      return;
    }

    const posterData = {
      image,
      name: document.getElementById('name').value.trim(),
      year: document.getElementById('year').value.trim(),
      metadata: collectMetadata(metadataFields),
      paragraph: document.getElementById('paragraph').value.trim(),
      fontPresetId: PosterFonts.getActivePresetId(),
    };

    currentPosterData = posterData;
    await Poster.ensureFontsLoaded();
    Poster.renderPoster(canvas, posterData);

    formSection.hidden = true;
    previewSection.hidden = false;
    pageSubtitle.hidden = true;
  }

  function handleEdit() {
    previewSection.hidden = true;
    formSection.hidden = false;
    pageSubtitle.hidden = false;
  }

  addFieldBtn.addEventListener('click', () => {
    metadataFields.appendChild(createMetadataRow());
  });

  form.addEventListener('submit', handleSubmit);
  editBtn.addEventListener('click', handleEdit);

  downloadPngBtn.addEventListener('click', () => {
    if (currentPosterData) {
      Poster.downloadPoster(canvas, currentPosterData, 'png');
    }
  });

  downloadJpegBtn.addEventListener('click', () => {
    if (currentPosterData) {
      Poster.downloadPoster(canvas, currentPosterData, 'jpeg');
    }
  });

  (async function init() {
    await PosterFonts.ensureFontsLoaded();
    buildFontPicker(fontPickerForm, 'font-preset-form', selectFontPreset);
    buildFontPicker(fontPickerPreview, 'font-preset-preview', selectFontPreset);
    const activeId = PosterFonts.getActivePresetId();
    syncFontPickerGroup('font-preset-form', activeId);
    syncFontPickerGroup('font-preset-preview', activeId);
  })();
})();
