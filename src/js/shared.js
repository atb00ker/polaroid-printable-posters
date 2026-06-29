(function () {
  function createMetadataRow(key = '', value = '') {
    const row = document.createElement('div');
    row.className = 'metadata-row';

    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.className = 'metadata-key';
    keyInput.placeholder = 'Runtime';
    keyInput.value = key;

    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.className = 'metadata-value';
    valueInput.placeholder = '169 minutes';
    valueInput.value = value;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-remove';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      row.remove();
    });

    row.append(keyInput, valueInput, removeBtn);
    return row;
  }

  function collectMetadata(container) {
    const rows = container.querySelectorAll('.metadata-row');
    /** @type {{ key: string, value: string }[]} */
    const metadata = [];

    for (const row of rows) {
      const key = row.querySelector('.metadata-key').value.trim();
      const value = row.querySelector('.metadata-value').value.trim();
      if (key && value) {
        metadata.push({ key, value });
      }
    }

    return metadata;
  }

  function createImageLoader() {
    /** @type {string | null} */
    let objectUrl = null;

    return {
      load(file) {
        return new Promise((resolve, reject) => {
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
          }

          objectUrl = URL.createObjectURL(file);
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => {
            if (objectUrl) {
              URL.revokeObjectURL(objectUrl);
              objectUrl = null;
            }
            reject(new Error('Failed to load image'));
          };
          img.src = objectUrl;
        });
      },
      revoke() {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
        }
      },
    };
  }

  function buildFontOption(preset, groupName, onChange) {
    const label = document.createElement('label');
    label.className = 'font-option';

    const input = document.createElement('input');
    input.type = 'radio';
    input.className = 'font-preset-radio';
    input.name = groupName;
    input.value = preset.id;

    const body = document.createElement('span');
    body.className = 'font-option-body';

    const presetLabel = document.createElement('span');
    presetLabel.className = 'font-option-label';
    presetLabel.textContent = preset.label;

    body.append(presetLabel);
    label.append(input, body);

    input.addEventListener('change', () => {
      if (input.checked && onChange) {
        onChange(preset.id);
      }
    });

    return label;
  }

  function buildFontPicker(container, groupName, onChange) {
    container.replaceChildren();
    container.classList.add('font-picker', 'font-picker--compact');
    for (const preset of window.PosterFonts.getPresets()) {
      container.appendChild(buildFontOption(preset, groupName, onChange));
    }
  }

  function syncFontPickerGroup(groupName, activeId) {
    document.querySelectorAll(`input.font-preset-radio[name="${groupName}"]`).forEach((input) => {
      input.checked = input.value === activeId;
    });
  }

  function getSelectedPresetId(groupName, fallback = 'film-credit') {
    const checked = document.querySelector(`input[name="${groupName}"]:checked`);
    return checked ? checked.value : fallback;
  }

  window.PosterShared = {
    createMetadataRow,
    collectMetadata,
    createImageLoader,
    buildFontPicker,
    syncFontPickerGroup,
    getSelectedPresetId,
  };
})();
