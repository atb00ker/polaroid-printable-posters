(function () {
  const FONT_FILES = [
    {
      family: 'ArchivoNarrow',
      url: '../deps/fonts/ArchivoNarrow-Variable.woff2',
      weight: '100 700',
    },
    {
      family: 'LibreFranklin',
      url: '../deps/fonts/LibreFranklin-Variable.woff2',
      weight: '100 900',
    },
    {
      family: 'WorkSans',
      url: '../deps/fonts/WorkSans-Variable.woff2',
      weight: '100 900',
    },
  ];

  const PRESETS = [
    {
      id: 'film-credit',
      label: 'Film Credit',
      description: 'Condensed title with classic poster credits',
      titleFamily: 'ArchivoNarrow',
      bodyFamily: 'LibreFranklin',
    },
    {
      id: 'condensed',
      label: 'All Condensed',
      description: 'Narrow, bold headline style throughout',
      titleFamily: 'ArchivoNarrow',
      bodyFamily: 'ArchivoNarrow',
    },
    {
      id: 'clean-sans',
      label: 'Clean Sans',
      description: 'Modern, balanced sans-serif',
      titleFamily: 'WorkSans',
      bodyFamily: 'WorkSans',
    },
  ];

  let activePresetId = 'film-credit';
  let loadPromise = null;

  function getPreset(id) {
    return PRESETS.find((preset) => preset.id === id) || PRESETS[0];
  }

  function getActivePreset() {
    return getPreset(activePresetId);
  }

  function getActivePresetId() {
    return activePresetId;
  }

  function setActivePreset(id) {
    if (getPreset(id)) {
      activePresetId = id;
    }
  }

  function getPresets() {
    return PRESETS.slice();
  }

  function ensureFontsLoaded() {
    if (loadPromise) {
      return loadPromise;
    }

    if (!('FontFace' in window)) {
      loadPromise = Promise.resolve();
      return loadPromise;
    }

    loadPromise = Promise.all(
      FONT_FILES.map(({ family, url, weight }) => {
        const font = new FontFace(family, `url(${url}) format('woff2')`, {
          weight,
          style: 'normal',
        });
        return font.load().then((loadedFont) => {
          document.fonts.add(loadedFont);
        });
      })
    )
      .then(() => document.fonts.ready)
      .catch(() => {
        loadPromise = null;
      });

    return loadPromise;
  }

  window.PosterFonts = {
    ensureFontsLoaded,
    getPresets,
    getPreset,
    getActivePreset,
    getActivePresetId,
    setActivePreset,
  };
})();
