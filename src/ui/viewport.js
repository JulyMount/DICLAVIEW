import { imageLoader } from '@cornerstonejs/core';

export function updatePatientOverlay(meta) {
  const topLeftOverlay = document.querySelector('.overlay.top-left');
  if (topLeftOverlay) {
    topLeftOverlay.innerHTML = `
      <strong>PACIENTE:</strong> ${meta.patientName || 'N/A'}<br/>
      <strong>ID:</strong> ${meta.patientId || 'N/A'}<br/>
      <strong>DATA:</strong> ${meta.studyDate || 'N/A'} [${meta.modality || ''}]
    `;
  }
}

export function updateOverlayMessage(htmlContent) {
  const topRightOverlay = document.querySelector('.overlay.top-right');
  if (topRightOverlay) {
    topRightOverlay.innerHTML = htmlContent;
  }
}

export function updateVOIOverlay(renderingEngine, viewportId) {
  const viewport = renderingEngine.getViewport(viewportId);
  if (!viewport) return;

  const { voiRange } = viewport.getProperties();
  if (voiRange) {
    const windowWidth = Math.round(voiRange.upper - voiRange.lower);
    const windowCenter = Math.round((voiRange.upper + voiRange.lower) / 2);

    const bottomLeftOverlay = document.querySelector('.overlay.bottom-left');
    if (bottomLeftOverlay) {
      bottomLeftOverlay.innerHTML = `W: ${windowWidth} L: ${windowCenter}`;
    }
  }
}

export async function generateThumbnail(imageId, canvasElement) {
  try {
    const image = await imageLoader.loadImage(imageId);
    const pixelData = image.getPixelData();
    const width = image.width;
    const height = image.height;

    const windowWidth = image.windowWidth || 400;
    const windowCenter = image.windowCenter || 40;

    const low = windowCenter - windowWidth / 2;
    const high = windowCenter + windowWidth / 2;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let i = 0; i < pixelData.length; i++) {
      let val = pixelData[i];

      if (image.intercept !== undefined) {
        val = val * (image.slope || 1) + image.intercept;
      }

      let normalized = ((val - low) / (high - low)) * 255;
      normalized = Math.max(0, Math.min(255, normalized));

      const idx = i * 4;
      data[idx] = normalized;
      data[idx + 1] = normalized;
      data[idx + 2] = normalized;
      data[idx + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);

    const destCtx = canvasElement.getContext('2d');
    destCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    destCtx.drawImage(tempCanvas, 0, 0, canvasElement.width, canvasElement.height);
  } catch (err) {
    console.error('Erro ao gerar miniatura:', err);
  }
}

export function renderSeriesSidebar(seriesList, onSelectSeries) {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  sidebar.innerHTML = '<h3>SÉRIES DO EXAME</h3>';

  seriesList.forEach((series, index) => {
    const item = document.createElement('div');
    item.className = `series-item ${index === 0 ? 'active' : ''}`;

    const middleIndex = Math.floor(series.items.length / 2);
    const representativeImageId = series.items[middleIndex]?.imageId;

    item.innerHTML = `
      <canvas class="series-thumbnail" width="60" height="60"></canvas>
      <div class="series-info">
        <div class="series-title">Série ${series.number}: ${series.description}</div>
        <div class="series-count">${series.items.length} fatias</div>
      </div>
    `;

    const canvas = item.querySelector('.series-thumbnail');
    if (representativeImageId && canvas) {
      generateThumbnail(representativeImageId, canvas);
    }

    item.addEventListener('click', () => {
      document.querySelectorAll('.series-item').forEach((el) => el.classList.remove('active'));
      item.classList.add('active');
      onSelectSeries(series);
    });

    sidebar.appendChild(item);
  });
}