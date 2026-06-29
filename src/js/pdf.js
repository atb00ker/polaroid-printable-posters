(function () {
  const Poster = window.Poster;
  const PosterFonts = window.PosterFonts;
  const {
    createMetadataRow,
    collectMetadata,
    createImageLoader,
    buildFontPicker,
    syncFontPickerGroup,
    getSelectedPresetId,
  } = window.PosterShared;

  const form = document.getElementById('pdf-poster-form');
  const formSection = document.getElementById('pdf-form-section');
  const previewSection = document.getElementById('pdf-preview-section');
  const pageSubtitle = document.getElementById('page-subtitle');
  const canvas = document.getElementById('pdf-sheet-canvas');
  const editBtn = document.getElementById('pdf-edit-btn');
  const downloadPdfBtn = document.getElementById('download-pdf');
  const fontPickerForm1 = document.getElementById('font-picker-pdf-1-form');
  const fontPickerForm2 = document.getElementById('font-picker-pdf-2-form');
  const fontPickerPreview1 = document.getElementById('font-picker-pdf-1-preview');
  const fontPickerPreview2 = document.getElementById('font-picker-pdf-2-preview');

  const imageInput1 = document.getElementById('pdf-image-1');
  const imageInput2 = document.getElementById('pdf-image-2');
  const imageError1 = document.getElementById('pdf-image-1-error');
  const imageError2 = document.getElementById('pdf-image-2-error');
  const metadataFields1 = document.getElementById('pdf-metadata-fields-1');
  const metadataFields2 = document.getElementById('pdf-metadata-fields-2');
  const addFieldBtn1 = document.getElementById('pdf-add-field-1');
  const addFieldBtn2 = document.getElementById('pdf-add-field-2');

  const imageLoader1 = createImageLoader();
  const imageLoader2 = createImageLoader();

  const GROUP_POSTER_1 = 'font-preset-pdf-1';
  const GROUP_POSTER_2 = 'font-preset-pdf-2';
  const DEFAULT_PRESET = 'film-credit';

  /** @type {PosterData[] | null} */
  let currentPdfPosters = null;

  function collectPosterData(index, image) {
    if (index === 1) {
      return {
        image,
        name: document.getElementById('pdf-name-1').value.trim(),
        year: document.getElementById('pdf-year-1').value.trim(),
        metadata: collectMetadata(metadataFields1),
        paragraph: document.getElementById('pdf-paragraph-1').value.trim(),
        fontPresetId: getSelectedPresetId(GROUP_POSTER_1, DEFAULT_PRESET),
      };
    }

    return {
      image,
      name: document.getElementById('pdf-name-2').value.trim(),
      year: document.getElementById('pdf-year-2').value.trim(),
      metadata: collectMetadata(metadataFields2),
      paragraph: document.getElementById('pdf-paragraph-2').value.trim(),
      fontPresetId: getSelectedPresetId(GROUP_POSTER_2, DEFAULT_PRESET),
    };
  }

  async function selectFontPreset1(id) {
    syncFontPickerGroup(GROUP_POSTER_1, id);

    if (currentPdfPosters) {
      currentPdfPosters[0].fontPresetId = id;
      await Poster.ensureFontsLoaded();
      Poster.renderA4LandscapeSheet(canvas, currentPdfPosters);
    }
  }

  async function selectFontPreset2(id) {
    syncFontPickerGroup(GROUP_POSTER_2, id);

    if (currentPdfPosters) {
      currentPdfPosters[1].fontPresetId = id;
      await Poster.ensureFontsLoaded();
      Poster.renderA4LandscapeSheet(canvas, currentPdfPosters);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    imageError1.hidden = true;
    imageError2.hidden = true;

    const file1 = imageInput1.files[0];
    const file2 = imageInput2.files[0];
    let hasError = false;

    if (!file1) {
      imageError1.hidden = false;
      imageInput1.focus();
      hasError = true;
    }

    if (!file2) {
      imageError2.hidden = false;
      if (!hasError) {
        imageInput2.focus();
      }
      hasError = true;
    }

    if (hasError) {
      return;
    }

    let image1;
    let image2;

    try {
      image1 = await imageLoader1.load(file1);
    } catch {
      imageError1.textContent = 'Could not load the selected image.';
      imageError1.hidden = false;
      return;
    }

    try {
      image2 = await imageLoader2.load(file2);
    } catch {
      imageError2.textContent = 'Could not load the selected image.';
      imageError2.hidden = false;
      return;
    }

    const posters = [collectPosterData(1, image1), collectPosterData(2, image2)];
    currentPdfPosters = posters;

    await Poster.ensureFontsLoaded();
    Poster.renderA4LandscapeSheet(canvas, posters);

    formSection.hidden = true;
    previewSection.hidden = false;
    pageSubtitle.hidden = true;
  }

  function handleEdit() {
    previewSection.hidden = true;
    formSection.hidden = false;
    pageSubtitle.hidden = false;
  }

  addFieldBtn1.addEventListener('click', () => {
    metadataFields1.appendChild(createMetadataRow());
  });

  addFieldBtn2.addEventListener('click', () => {
    metadataFields2.appendChild(createMetadataRow());
  });

  form.addEventListener('submit', handleSubmit);
  editBtn.addEventListener('click', handleEdit);

  downloadPdfBtn.addEventListener('click', () => {
    if (currentPdfPosters) {
      Poster.downloadA4Pdf(currentPdfPosters);
    }
  });

  (async function init() {
    await PosterFonts.ensureFontsLoaded();
    buildFontPicker(fontPickerForm1, GROUP_POSTER_1, selectFontPreset1);
    buildFontPicker(fontPickerForm2, GROUP_POSTER_2, selectFontPreset2);
    buildFontPicker(fontPickerPreview1, GROUP_POSTER_1, selectFontPreset1);
    buildFontPicker(fontPickerPreview2, GROUP_POSTER_2, selectFontPreset2);
    syncFontPickerGroup(GROUP_POSTER_1, DEFAULT_PRESET);
    syncFontPickerGroup(GROUP_POSTER_2, DEFAULT_PRESET);
  })();
})();
