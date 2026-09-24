import { initCornerstone } from './core/cornerstone-setup.js';
import { setupTools, setActiveTool, clearAllAnnotations } from './core/tools-config.js';
import { RenderingEngine, Enums, imageLoader, utilities } from '@cornerstonejs/core';
import {
  WindowLevelTool,
  PanTool,
  ZoomTool,
  LengthTool,
  CircleROITool,
  PlanarFreehandROITool,
} from '@cornerstonejs/tools';
import dicomImageLoaderModule from '@cornerstonejs/dicom-image-loader';
import dicomParser from 'dicom-parser';
import JSZip from 'jszip';

let isCinePlaying = false;
let cineInterval = null;
let cineFps = 20;

const dicomImageLoader = dicomImageLoaderModule.default || dicomImageLoaderModule;

let renderingEngine;
const viewportId = 'DICLA_STACK_VIEWPORT';
const renderingEngineId = 'DiclaRenderingEngine';
let activeImageIds = [];

async function startApp() {
  await initCornerstone();

  renderingEngine = new RenderingEngine(renderingEngineId);
  const element = document.getElementById('dicom-viewport');

  const viewportInput = {
    viewportId,
    type: Enums.ViewportType.STACK,
    element,
    defaultOptions: {
      background: [0, 0, 0],
    },
  };

  renderingEngine.enableElement(viewportInput);
  setupTools(renderingEngineId, viewportId);
  setupToolbarEvents();
  setupSliderEvents(element);
  setupCineEvents();

  document.getElementById('dicom-input').addEventListener('change', handleFileSelect);
}

function updateActiveButtonUI(activeId) {
  const toolbar = document.querySelector('.toolbar');
  if (!toolbar) return;

  // Varre e remove a classe 'active' de TODOS os elementos da toolbar
  toolbar.querySelectorAll('*').forEach((el) => {
    el.classList.remove('active');
  });

  const activeElement = document.getElementById(activeId);
  if (!activeElement) return;

  // Aplica o destaque no botão clicado
  activeElement.classList.add('active');

  // Se o botão estiver num menu dropdown (como Linha ou Círculo), ativa o dropdown pai
  const parentDropdown = activeElement.closest('.dropdown');
  if (parentDropdown) {
    parentDropdown.classList.add('active');
  }
}

// Formata o nome do paciente (ex: "SILVA^JOAO" -> "JOAO SILVA")
function formatPatientName(rawName) {
  if (!rawName) return 'PACIENTE ANÓNIMO';
  const parts = rawName.split('^').filter(Boolean);
  return parts.reverse().join(' ').trim() || 'PACIENTE ANÓNIMO';
}

// Formata a data DICOM (ex: "20260924" -> "24/09/2026")
function formatDate(rawDate) {
  if (!rawDate || rawDate.length !== 8) return rawDate || '';
  const yyyy = rawDate.substring(0, 4);
  const mm = rawDate.substring(4, 6);
  const dd = rawDate.substring(6, 8);
  return `${dd}/${mm}/${yyyy}`;
}

function setupToolbarEvents() {
  const btnJanela = document.getElementById('btn-janela');
  const btnZoom = document.getElementById('btn-zoom');
  const btnPan = document.getElementById('btn-pan');
  const btnCaneta = document.getElementById('btn-caneta');
  const btnMedirLinha = document.getElementById('btn-medir-linha');
  const btnMedirCirculo = document.getElementById('btn-medir-circulo');

  // Janela / Nível (Padrão inicial)
  btnJanela?.addEventListener('click', () => {
    setActiveTool(WindowLevelTool.toolName);
    updateActiveButtonUI('btn-janela');
  });

  // Zoom
  btnZoom?.addEventListener('click', () => {
    setActiveTool(ZoomTool.toolName);
    updateActiveButtonUI('btn-zoom');
  });

  // Pan (Arrastar)
  btnPan?.addEventListener('click', () => {
    setActiveTool(PanTool.toolName);
    updateActiveButtonUI('btn-pan');
  });

  // Caneta
  btnCaneta?.addEventListener('click', () => {
    setActiveTool(PlanarFreehandROITool.toolName);
    updateActiveButtonUI('btn-caneta');
  });

  // Medição - Linha
  btnMedirLinha?.addEventListener('click', () => {
    setActiveTool(LengthTool.toolName);
    updateActiveButtonUI('btn-medir-linha');
    const btnMedir = document.getElementById('btn-medir');
    if (btnMedir) btnMedir.innerText = '📏 Linha ▼';
  });

  // Medição - Círculo
  btnMedirCirculo?.addEventListener('click', () => {
    setActiveTool(CircleROITool.toolName);
    updateActiveButtonUI('btn-medir-circulo');
    const btnMedir = document.getElementById('btn-medir');
    if (btnMedir) btnMedir.innerText = '⭕ Círculo ▼';
  });

  // Botão Limpar (não altera a ferramenta ativa, apenas executa a ação)
  document.getElementById('btn-limpar')?.addEventListener('click', () => {
    clearAllAnnotations(renderingEngineId, viewportId);
  });

  // Define "Janela / Nível" como ativo no arranque
  updateActiveButtonUI('btn-janela');
}

async function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  if (!files.length) return;

  updateOverlay('A ler metadados DICOM...');

  let fileList = [];

  // Extrair ficheiros de ZIP ou processar ficheiros diretos
  for (const file of files) {
    if (file.name.trim().toLowerCase().endsWith('.zip')) {
      const extractedFiles = await extractZipFiles(file);
      fileList.push(...extractedFiles);
    } else {
      fileList.push(file);
    }
  }

  // Agrupar ficheiros por Série usando DICOM Metadata
  const seriesMap = {};

  for (const file of fileList) {
    const metadata = await extractDicomMetadata(file);
    if (!metadata) continue;

    const imageId = dicomImageLoader.wadouri.fileManager.add(file);
    const uid = metadata.seriesUid;

    if (!seriesMap[uid]) {
      seriesMap[uid] = {
        uid,
        number: metadata.seriesNumber,
        description: metadata.seriesDescription,
        items: [],
      };
    }

    seriesMap[uid].items.push({
      imageId,
      zPosition: metadata.zPosition,
      instanceNumber: metadata.instanceNumber,
      metadata,
    });
  }

  const seriesList = Object.values(seriesMap);

  if (seriesList.length === 0) {
    updateOverlay('Nenhum ficheiro DICOM válido encontrado.');
    return;
  }

  // Ordenar cada série espacialmente pela Posição Z real
  seriesList.forEach((series) => {
    series.items.sort((a, b) => {
      if (a.zPosition !== b.zPosition) {
        return a.zPosition - b.zPosition;
      }
      return a.instanceNumber - b.instanceNumber;
    });
  });

  // Atualizar painel lateral esquerdo com as séries encontradas
  renderSeriesSidebar(seriesList);

  // Carregar a primeira série automaticamente
  loadSeries(seriesList[0]);
}

async function extractZipFiles(zipFile) {
  const zip = await JSZip.loadAsync(zipFile);
  const files = [];

  for (const relativePath in zip.files) {
    const zipEntry = zip.files[relativePath];
    if (zipEntry.dir || relativePath.includes('__MACOSX') || relativePath.startsWith('.')) {
      continue;
    }
    const blob = await zipEntry.async('blob');
    files.push(new File([blob], zipEntry.name));
  }

  return files;
}

async function extractDicomMetadata(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const byteArray = new Uint8Array(arrayBuffer);
    const dataSet = dicomParser.parseDicom(byteArray);

    const seriesUid = dataSet.string('x0020000e') || '1.2.840.unknown';
    const seriesDescription = dataSet.string('x0008103e') || 'Série sem descrição';
    const seriesNumber = dataSet.intString('x00200011') || 1;
    const instanceNumber = dataSet.intString('x00200013') || 0;

    // Novas Tags de Paciente e Exame
    const patientName = formatPatientName(dataSet.string('x00100010'));
    const patientId = dataSet.string('x00100020') || 'Sem ID';
    const studyDate = formatDate(dataSet.string('x00080020'));
    const modality = dataSet.string('x00080060') || 'CT';

    let zPosition = instanceNumber;
    const posString = dataSet.string('x00200032'); // ImagePositionPatient

    if (posString) {
      const coords = posString.split('\\');
      if (coords.length === 3) {
        zPosition = parseFloat(coords[2]);
      }
    }

    return {
      seriesUid,
      seriesDescription,
      seriesNumber,
      instanceNumber,
      zPosition,
      patientName,
      patientId,
      studyDate,
      modality,
    };
  } catch (e) {
    return null;
  }
}

// Função para carregar e desenhar a imagem no canvas da miniatura
async function generateThumbnail(imageId, canvasElement) {
  try {
    const image = await imageLoader.loadImage(imageId);
    const pixelData = image.getPixelData();
    const width = image.width;
    const height = image.height;

    // Obtém Janela e Nível padrão da imagem (ou usa padrão de Tomografia W:400 L:40)
    const windowWidth = image.windowWidth || 400;
    const windowCenter = image.windowCenter || 40;

    const low = windowCenter - windowWidth / 2;
    const high = windowCenter + windowWidth / 2;

    // Canvas temporário com a resolução original do corte
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    // Converte os pixels DICOM para Escala de Cinza (0 a 255)
    for (let i = 0; i < pixelData.length; i++) {
      let val = pixelData[i];

      // Aplica inclinação e interceção DICOM (Rescale Slope/Intercept)
      if (image.intercept !== undefined) {
        val = val * (image.slope || 1) + image.intercept;
      }

      // Normaliza o pixel dentro do intervalo da janela
      let normalized = ((val - low) / (high - low)) * 255;
      normalized = Math.max(0, Math.min(255, normalized));

      const idx = i * 4;
      data[idx] = normalized;     // Red
      data[idx + 1] = normalized; // Green
      data[idx + 2] = normalized; // Blue
      data[idx + 3] = 255;        // Alpha (opacidade)
    }

    ctx.putImageData(imgData, 0, 0);

    // Redimensiona para o quadrado de 60x60px na barra lateral
    const destCtx = canvasElement.getContext('2d');
    destCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    destCtx.drawImage(tempCanvas, 0, 0, canvasElement.width, canvasElement.height);
  } catch (err) {
    console.error('Erro ao gerir miniatura:', err);
  }
}

function renderSeriesSidebar(seriesList) {
  const sidebar = document.querySelector('.sidebar');
  sidebar.innerHTML = '<h3>SÉRIES DO EXAME</h3>';

  seriesList.forEach((series, index) => {
    const item = document.createElement('div');
    item.className = `series-item ${index === 0 ? 'active' : ''}`;

    // Escolhe a fatia central da série para a pré-visualização
    const middleIndex = Math.floor(series.items.length / 2);
    const representativeImageId = series.items[middleIndex]?.imageId;

    item.innerHTML = `
      <canvas class="series-thumbnail" width="60" height="60"></canvas>
      <div class="series-info">
        <div class="series-title">Série ${series.number}: ${series.description}</div>
        <div class="series-count">${series.items.length} fatias</div>
      </div>
    `;

    // Renderiza a miniatura em segundo plano
    const canvas = item.querySelector('.series-thumbnail');
    if (representativeImageId && canvas) {
      generateThumbnail(representativeImageId, canvas);
    }

    item.addEventListener('click', () => {
      document.querySelectorAll('.series-item').forEach((el) => el.classList.remove('active'));
      item.classList.add('active');
      loadSeries(series);
    });

    sidebar.appendChild(item);
  });
}

// Atualiza o canto inferior esquerdo com os valores em tempo real de Janela/Nível (W/L)
function updateVOIOverlay() {
  const viewport = renderingEngine.getViewport(viewportId);
  if (!viewport) return;

  const { voiRange } = viewport.getProperties();
  if (voiRange) {
    // Cálculo da Largura da Janela (W) e Nível/Centro (L)
    const windowWidth = Math.round(voiRange.upper - voiRange.lower);
    const windowCenter = Math.round((voiRange.upper + voiRange.lower) / 2);

    const bottomLeftOverlay = document.querySelector('.overlay.bottom-left');
    if (bottomLeftOverlay) {
      bottomLeftOverlay.innerHTML = `W: ${windowWidth} L: ${windowCenter}`;
    }
  }
}

function setupSliderEvents(viewportElement) {
  const slider = document.getElementById('slice-slider');

  slider.addEventListener('input', (e) => {
    const index = parseInt(e.target.value, 10);
    const viewport = renderingEngine.getViewport(viewportId);
    if (viewport && activeImageIds.length > 0) {
      viewport.setImageIdIndex(index);
    }
  });

  slider.addEventListener('mousedown', () => stopCine());

  // Atualiza fatias e W/L ao mudar de imagem
  viewportElement.addEventListener(Enums.Events.STACK_NEW_IMAGE, (evt) => {
    const { imageIdIndex } = evt.detail;
    slider.value = imageIdIndex;
    updateSliceOverlay(imageIdIndex + 1, activeImageIds.length);
    updateVOIOverlay();
  });

  // Escuta o ajuste manual de Janela/Nível (Janelamento)
  viewportElement.addEventListener(Enums.Events.VOI_MODIFIED, () => {
    updateVOIOverlay();
  });
}

async function loadSeries(series) {
    stopCine();
  activeImageIds = series.items.map((item) => item.imageId);

  const viewport = renderingEngine.getViewport(viewportId);
  await viewport.setStack(activeImageIds);
  viewport.render();
  viewport.resetCamera();

  const slider = document.getElementById('slice-slider');
  slider.max = activeImageIds.length - 1;
  slider.value = 0;

  // Atualiza os dados do paciente no overlay superior esquerdo
  const firstMetadata = series.items[0]?.metadata || {};
  updatePatientOverlay(firstMetadata);
  updateSliceOverlay(1, activeImageIds.length);
  updateVOIOverlay();
}

function updatePatientOverlay(meta) {
  const topLeftOverlay = document.querySelector('.overlay.top-left');
  if (topLeftOverlay) {
    topLeftOverlay.innerHTML = `
      <strong>PACIENTE:</strong> ${meta.patientName || 'N/A'}<br/>
      <strong>ID:</strong> ${meta.patientId || 'N/A'}<br/>
      <strong>DATA:</strong> ${meta.studyDate || 'N/A'} [${meta.modality || ''}]
    `;
  }
}

function updateSliceOverlay(current, total) {
  const topRightOverlay = document.querySelector('.overlay.top-right');
  if (topRightOverlay) {
    topRightOverlay.innerHTML = `
      EXAME CARREGADO<br/>
      Fatia: ${current} / ${total}
    `;
  }
}

function updateOverlay(htmlContent) {
  const topRightOverlay = document.querySelector('.overlay.top-right');
  if (topRightOverlay) {
    topRightOverlay.innerHTML = htmlContent;
  }
}

function setupCineEvents() {
  const btnCine = document.getElementById('btn-cine');
  const selectFps = document.getElementById('cine-fps');

  btnCine?.addEventListener('click', toggleCine);

  selectFps?.addEventListener('change', (e) => {
    cineFps = parseInt(e.target.value, 10);
    if (isCinePlaying) {
      startCine(); // Reinicia a reprodução com a nova velocidade
    }
  });
}

function toggleCine() {
  if (isCinePlaying) {
    stopCine();
  } else {
    startCine();
  }
}

function startCine() {
  if (activeImageIds.length <= 1) return;

  stopCine(); // Garante que limpa qualquer loop pré-existente
  isCinePlaying = true;

  const btnCine = document.getElementById('btn-cine');
  if (btnCine) {
    btnCine.classList.add('playing');
    btnCine.innerHTML = '⏸️ Pausa';
  }

  cineInterval = setInterval(() => {
    const viewport = renderingEngine.getViewport(viewportId);
    if (!viewport || activeImageIds.length === 0) return;

    const currentIndex = viewport.getCurrentImageIdIndex();
    const nextIndex = (currentIndex + 1) % activeImageIds.length; // Ciclo contínuo

    viewport.setImageIdIndex(nextIndex);
  }, 1000 / cineFps);
}

function stopCine() {
  isCinePlaying = false;
  if (cineInterval) {
    clearInterval(cineInterval);
    cineInterval = null;
  }

  const btnCine = document.getElementById('btn-cine');
  if (btnCine) {
    btnCine.classList.remove('playing');
    btnCine.innerHTML = '▶️ Cine';
  }
}

document.addEventListener('DOMContentLoaded', startApp);