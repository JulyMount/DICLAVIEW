import { initCornerstone } from './core/cornerstone-setup.js';
import { setupTools } from './core/tools-config.js';
import { setupToolbarEvents } from './ui/toolbar.js';
import {
  updatePatientOverlay,
  updateOverlayMessage,
  renderSeriesSidebar,
} from './ui/viewport.js';

import * as cornerstone from '@cornerstonejs/core';
import dicomImageLoaderModule from '@cornerstonejs/dicom-image-loader';
import dicomParser from 'dicom-parser';
import JSZip from 'jszip';

const dicomImageLoader = dicomImageLoaderModule.default || dicomImageLoaderModule;

let renderingEngine;
const renderingEngineId = 'DiclaRenderingEngine';
const volumeId = 'cornerstoneStreamingImageVolume:DICLA_MPR_VOLUME';

const viewportIdAxial = 'CT_AXIAL';
const viewportIdSagittal = 'CT_SAGITTAL';
const viewportIdCoronal = 'CT_CORONAL';
const viewportIds = [viewportIdAxial, viewportIdSagittal, viewportIdCoronal];

async function startApp() {
  await initCornerstone();

  renderingEngine = new cornerstone.RenderingEngine(renderingEngineId);

  const viewportInputs = [
    {
      viewportId: viewportIdAxial,
      type: cornerstone.Enums.ViewportType.ORTHOGRAPHIC,
      element: document.getElementById('viewport-axial'),
      defaultOptions: {
        orientation: cornerstone.Enums.OrientationAxis.AXIAL,
        background: [0, 0, 0],
      },
    },
    {
      viewportId: viewportIdSagittal,
      type: cornerstone.Enums.ViewportType.ORTHOGRAPHIC,
      element: document.getElementById('viewport-sagittal'),
      defaultOptions: {
        orientation: cornerstone.Enums.OrientationAxis.SAGITTAL,
        background: [0, 0, 0],
      },
    },
    {
      viewportId: viewportIdCoronal,
      type: cornerstone.Enums.ViewportType.ORTHOGRAPHIC,
      element: document.getElementById('viewport-coronal'),
      defaultOptions: {
        orientation: cornerstone.Enums.OrientationAxis.CORONAL,
        background: [0, 0, 0],
      },
    },
  ];

  renderingEngine.setViewports(viewportInputs);
  setupTools(renderingEngineId, viewportIds);
  setupToolbarEvents(renderingEngineId, viewportIds);

  document.getElementById('dicom-input')?.addEventListener('change', handleFileSelect);
}

function formatPatientName(rawName) {
  if (!rawName) return 'PACIENTE ANÓNIMO';
  const parts = rawName.split('^').filter(Boolean);
  return parts.reverse().join(' ').trim() || 'PACIENTE ANÓNIMO';
}

function formatDate(rawDate) {
  if (!rawDate || rawDate.length !== 8) return rawDate || '';
  const yyyy = rawDate.substring(0, 4);
  const mm = rawDate.substring(4, 6);
  const dd = rawDate.substring(6, 8);
  return `${dd}/${mm}/${yyyy}`;
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

    const patientName = formatPatientName(dataSet.string('x00100010'));
    const patientId = dataSet.string('x00100020') || 'Sem ID';
    const studyDate = formatDate(dataSet.string('x00080020'));
    const modality = dataSet.string('x00080060') || 'CT';

    let zPosition = instanceNumber;
    const posString = dataSet.string('x00200032');
    if (posString) {
      const coords = posString.split('\\');
      if (coords.length === 3) zPosition = parseFloat(coords[2]);
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

async function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  if (!files.length) return;

  updateOverlayMessage('A processar volume 3D...');

  let fileList = [];
  for (const file of files) {
    if (file.name.trim().toLowerCase().endsWith('.zip')) {
      const extractedFiles = await extractZipFiles(file);
      fileList.push(...extractedFiles);
    } else {
      fileList.push(file);
    }
  }

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
    updateOverlayMessage('Nenhum ficheiro DICOM válido encontrado.');
    return;
  }

  seriesList.forEach((series) => {
    series.items.sort((a, b) => a.zPosition - b.zPosition || a.instanceNumber - b.instanceNumber);
  });

  renderSeriesSidebar(seriesList, loadSeriesVolume);
  loadSeriesVolume(seriesList[0]);
}

async function loadSeriesVolume(series) {
  const imageIds = series.items.map((item) => item.imageId);
  if (!imageIds.length) return;

  try {
    updateOverlayMessage('A preparar metadados (pode demorar alguns segundos)...');
    cornerstone.cache.purgeCache();

    // CORREÇÃO: Força o parse dos ficheiros locais para popular os metadados ANTES do Volume MPR
    await Promise.all(
      imageIds.map((id) => cornerstone.imageLoader.loadAndCacheImage(id))
    );

    updateOverlayMessage('A construir Volume MPR 3D...');

    const volume = await cornerstone.volumeLoader.createAndCacheVolume(volumeId, {
      imageIds,
    });

    volume.load();

    await cornerstone.setVolumesForViewports(
      renderingEngine,
      [{ volumeId }],
      viewportIds
    );

    renderingEngine.renderViewports(viewportIds);

    const firstMetadata = series.items[0]?.metadata || {};
    updatePatientOverlay(firstMetadata);
    updateOverlayMessage('Volume MPR Carregado com Sucesso!');
  } catch (err) {
    console.error('Erro ao montar volume MPR:', err);
    updateOverlayMessage('Erro ao carregar volume 3D.');
  }
}

document.addEventListener('DOMContentLoaded', startApp);